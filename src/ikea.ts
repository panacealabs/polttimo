import { Accessory, TradfriClient, discoverGateway } from 'node-tradfri-client'
import { writeFileSync, readFileSync } from 'fs'

const CREDENTIALS_FILE = '.state'

interface Credentials {
  identity: string
  psk: string
}

export class Devices {
  private secret: string
  private devices: Accessory[] = []
  private client: TradfriClient

  private deviceUpdated(device: Accessory) {
    this.devices[device.instanceId] = device
  }

  private deviceRemoved(instanceId: number) {
    delete this.devices[instanceId]
  }

  private async connect(credentials: Credentials) {
    await this.client.connect(credentials.identity, credentials.psk)
  }

  private async reauthenticate(secret: string): Promise<Credentials> {
    const credentials = await this.client.authenticate(secret)
    console.log('Authenticated successfully')
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials), 'utf-8')
    return credentials
  }

  constructor(secret: string) {
    this.secret = secret
  }

  async start() {
    if (this.client != null) {
      throw new Error('Already started')
    }

    const gateway = await discoverGateway()

    if (gateway == null) {
      throw new Error('Could not discover an Ikea hub on the local network')
    }
    const address = gateway.addresses[0]
    console.log('Discovered', gateway)

    this.client = new TradfriClient(address, {watchConnection: true})
    this.client.on('device updated', (device) => this.deviceUpdated(device))
    this.client.on('device removed', (deviceId) => this.deviceRemoved(deviceId))

    try {
      const credentials = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'))
      console.log('Use credentials from disk')
      await this.connect(credentials)
    } catch (e) {
      console.log('No valid credentials found, re-authenticate', e)
      await this.connect(await this.reauthenticate(this.secret))
    }

    console.log('Connected!')

    await this.client.observeDevices()
  }

  destroy() {
    this.client.destroy()
  }

  listDevices() {
    return this.devices.filter((d) => d != null)
  }

  findByName(name: string) {
    return this.listDevices().find((device) => device.name === name)
  }
}
