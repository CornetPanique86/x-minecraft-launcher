import { DEFAULT_PROFILE, Instance } from '../entities/instance'
import { InstanceSchema } from '../entities/instance.schema'
import { DeepPartial } from '../util/object'
import { ServiceKey, StatefulService } from './Service'

export type CreateInstanceOption = Partial<Omit<InstanceSchema, 'lastAccessDate' | 'creationDate'>> & {
  path?: string
  resolution?: InstanceSchema['resolution']
  runtime?: InstanceSchema['runtime']
  server?: InstanceSchema['server']
}
export interface EditInstanceOptions extends Partial<Omit<InstanceSchema, 'runtime' | 'server'>> {
  resolution?: InstanceSchema['resolution']
  runtime?: InstanceSchema['runtime']
  /**
   * If this is undefined, it will disable the server of this instance
   */
  server?: InstanceSchema['server']
  /**
    * The target instance path. If this is absent, it will use the selected instance.
    */
  instancePath?: string
}

export class InstanceState {
  /**
   * All loaded launch instances
   */
  all = {} as { [path: string]: Instance }
  /**
  * Current selected path
  */
  path = '' as string

  /**
   * All selected instances.
   */
  instances: Instance[] = []

  // /**
  //  * All selected instances.
  //  */
  // get instances() {
  //   return Object.values(this.all)
  // }

  /**
   * The selected instance config.
   */
  get instance(): Instance {
    return this.instances.find(v => v.path === this.path) ?? DEFAULT_PROFILE
  }

  instanceAdd(instance: Instance) {
    /**
     * Prevent the case that hot reload keep the vuex state
     */
    if (!this.all[instance.path]) {
      // TODO: remove in vue3
      // set(this.all, instance.path, { ...instance, serverStatus: UNKNOWN_STATUS })
      const object = {
        ...instance,
      }
      this.all[instance.path] = object
      this.instances.push(this.all[instance.path])
    }
  }

  instanceRemove(path: string) {
    // TODO: remove in vue3
    // remove(this.all, id)
    delete this.all[path]
    this.instances = this.instances.filter(i => i.path !== path)
  }

  instanceSelect(path: string) {
    let inst = this.instances.find(i => i.path === (path || this.path))
    if (inst) {
      this.path = path
    } else if (this.path === '') {
      this.path = Object.keys(this.all)[0]
    }
    inst = this.instances.find(i => i.path === (path || this.path))
    if (inst) {
      inst.lastAccessDate = Date.now()
    }
  }

  /**
   * Edit the profile content. This commit will trigger save function to store the data to the disk.
   * Don't use this directly. Use `editProfile` action
   * @param payload The modified data
   */
  instanceEdit(settings: DeepPartial<InstanceSchema> & { path: string }) {
    const inst = this.instances.find(i => i.path === (settings.path || this.path)) /* this.all[settings.path || this.path] */

    if (!inst) {
      console.error(`Cannot commit profile. Illegal State with missing profile ${this.path}`)
      return
    }

    inst.name = typeof settings.name === 'string' ? settings.name : inst.name

    inst.author = settings.author || inst.author
    inst.description = settings.description || inst.description
    inst.version = typeof settings.version === 'string' ? settings.version : inst.version

    if (settings.server) {
      if (inst.server) {
        inst.server.host = settings.server.host || inst.server.host
        inst.server.port = settings.server.port || inst.server.port
      } else {
        inst.server = {
          host: settings.server.host,
          port: settings.server.port,
        }
      }
    }

    if (settings.runtime) {
      const versions = settings.runtime
      if (inst.runtime.minecraft !== settings.runtime.minecraft && typeof versions.minecraft === 'string') {
        // if minecraft version changed, all other related versions are rest.
        inst.runtime.minecraft = versions.minecraft
        for (const versionType of Object.keys(inst.runtime).filter(v => v !== 'minecraft')) {
          inst.runtime[versionType] = ''
        }
      }

      for (const versionType of Object.keys(versions).filter(v => v !== 'minecraft')) {
        const ver = versions[versionType]
        if (typeof ver === 'string') {
          inst.runtime[versionType] = ver
        }
      }
    }

    if ('minMemory' in settings) {
      inst.minMemory = (typeof settings.minMemory === 'number') && settings.minMemory > 0 ? settings.minMemory : 0
    }
    if ('maxMemory' in settings) {
      inst.maxMemory = (typeof settings.maxMemory === 'number') && settings.maxMemory > 0 ? settings.maxMemory : 0
    }

    if (settings.vmOptions instanceof Array && settings.vmOptions.every(r => typeof r === 'string')) {
      inst.vmOptions = Object.seal(settings.vmOptions)
    }
    if (settings.mcOptions instanceof Array && settings.mcOptions.every(r => typeof r === 'string')) {
      inst.mcOptions = Object.seal(settings.mcOptions)
    }

    inst.url = settings.url || inst.url
    inst.icon = settings.icon || inst.icon
    inst.java = settings.java || inst.java
    inst.modpackVersion = settings.modpackVersion || inst.modpackVersion
    inst.fileApi = settings.fileApi || inst.fileApi

    if (typeof settings.showLog === 'boolean') {
      inst.showLog = settings.showLog
    }
    if (typeof settings.hideLauncher === 'boolean') {
      inst.hideLauncher = settings.hideLauncher
    }
  }
}

/**
 * Provide instance spliting service. It can split the game into multiple environment and dynamiclly deploy the resource to run.
 */
export interface InstanceService extends StatefulService<InstanceState> {
  loadInstance(path: string): Promise<boolean>
  /**
   * Create a managed instance (either a modpack or a server) under the managed folder.
   * @param option The creation option
   * @returns The instance path
   */
  createInstance(payload: CreateInstanceOption): Promise<string>
  /**
   * Create a managed instance in storage.
   */
  createAndMount(payload: CreateInstanceOption): Promise<string>
  /**
   * Mount the instance as the current active instance.
   * @param path the instance path
   */
  mountInstance(path: string): Promise<void>
  /**
   * Delete the managed instance from the disk
   * @param path The instance path
   */
  deleteInstance(path?: string): Promise<void>
  /**
   * Edit the instance. If the `path` is not present, it will edit the current selected instance.
   * Otherwise, it will edit the instance on the provided path.
   */
  editInstance(options: EditInstanceOptions): Promise<void>
  // /**
  //  * Create a instance by server info and status.
  //  * This will try to ping the server and apply the mod list if it's a forge server.
  //  */
  // createInstanceFromServer(info: ServerInfo & {
  //   status: Status
  // }): Promise<string>
}

export const InstanceServiceKey: ServiceKey<InstanceService> = 'InstanceService'
