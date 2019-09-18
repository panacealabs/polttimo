import 'isomorphic-fetch'

export interface CircleConfig {
  circleToken: string
  circleProject: string
  circleWorkflows: string[]
}

export type BuildStatus = 'SUCCESS' | 'FAILURE'

const getBuildStatus = async (config: CircleConfig): Promise<BuildStatus> => {
  const result = await fetch('https://circleci.com/api/v1/projects?circle-token=' + config.circleToken)
  const projects = await result.json()
  const project = projects.find((p) => p.reponame === config.circleProject)
  if (project == null) {
    throw new Error(`CircleCI project "${config.circleProject}" not found`)
  }
  const master = project.branches['master']
  const missingWorkflows = config.circleWorkflows.filter((workflow) => master.latest_completed_workflows[workflow] == null)
  if (missingWorkflows.length > 0) {
    throw new Error(`Could not find the following CircleCI workflows under the "${config.circleProject}" project's master branch: ${missingWorkflows.map((w) => `"${w}"`).join(', ')}`)
  }
  const workflowStatuses = config.circleWorkflows.map((workflow) => ({
    workflow,
    status: master.latest_completed_workflows[workflow].status
  }))
  const failed = workflowStatuses.filter((ws) => ws.status === 'failed')
  const status = failed.length > 0 ? 'FAILURE' : 'SUCCESS'
  console.log(`${failed.length} failed workflows (${failed.map((f) => f.workflow).join(', ')}) -> status ${status}`)
  return status
}

export const monitorBuildStatus = (config: CircleConfig, onChange: (status: BuildStatus) => Promise<void>) => {
  const poll = async () => {
    try {
      const status = await getBuildStatus(config)
      await onChange(status)
    } catch (e) {
      console.error('Error while polling for build status', e)
    }
    setTimeout(poll, 5000)
  }
  poll()
}
