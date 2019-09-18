import { Devices } from './ikea'
import { monitorBuildStatus } from './circle'
import { Accessory } from 'node-tradfri-client'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const setRGBColor = async (device: Accessory, color: string, brightness: number) => {
  for (const light of device.lightList) {
    if (light.spectrum !== 'rgb') {
      throw new Error(`Lightbulb should be an RGB light`)
    } else if (light.color !== color) {
      await light.setColor(color, 0.2)
      // Sending commands too quickly seems to confuse the Ikea hub
      await delay(500)
      await light.setBrightness(brightness, 0.2)
    }
  }
}

const env = (key: string) => {
  const value = process.env[key]
  if (value == null || value.length === 0) {
    throw new Error(`${key} missing from env`)
  }
  return value
}

const run = async () => {
  const circleToken = env('CIRCLE_TOKEN')
  const circleProject = env('CIRCLE_PROJECT')
  const circleWorkflows = env('CIRCLE_WORKFLOWS').split(',')
  const ikeaSecret = env('IKEA_SECRET')
  const lightbulbName = env('LIGHTBULB_NAME')

  console.log(
`Watching the following workflows in the CircleCI project "${circleProject}":
${circleWorkflows.map((s) => `- ${s}`).join('\n')}

If any of these fail, I'll turn "${lightbulbName}" red 😎
`)

  console.log('Looking for your Ikea hub on the local network...')

  const devices = new Devices(ikeaSecret)
  await devices.start()

  monitorBuildStatus({circleToken, circleProject, circleWorkflows}, async (status) => {
    console.log('Build status changed to', status)
    const lightbulb = devices.findByName(lightbulbName)
    if (lightbulb == null) {
      console.error('Lightbulb with name', lightbulbName, 'not found')
    } else {
      if (status === 'SUCCESS') {
        await setRGBColor(lightbulb, '00ff00', 40)
      } else {
        await setRGBColor(lightbulb, 'ff0000', 100)
      }
    }
  })
}

run().catch((e) => console.error(e))
