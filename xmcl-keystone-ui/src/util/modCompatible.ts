import { parseVersion, VersionRange } from '@xmcl/runtime-api'
import { satisfies } from 'semver'
import { ModDependencies, ModDependency } from './modDependencies'

export type Compatible = 'maybe' | boolean

export type CompatibleDetail = {
  modId: string

  compatible: Compatible
  /**
   * Can be either semantic version or version range
   */
  requirements: string | string[]

  version: string
}

export function resolveCompatible(deps: Compatible[]) {
  const values = deps
  if (values.some(v => v === false)) {
    return false
  }
  if (values.some(v => v === 'maybe')) {
    return 'maybe'
  }
  return true
}

/**
 * Resolve the compatibility of a mod dependency.
 *
 * @param dep The dependency
 * @param version The version of the mod
 */
export function getModCompatiblity(dep: ModDependency, version: string): Compatible {
  const id = dep.modId
  let compatible: Compatible = 'maybe'
  if (!version) {
    // No such version
    return false
  }
  if (dep.versionRange) {
    // Resolve version range compability
    const versionRange = dep.versionRange
    const range = VersionRange.createFromVersionSpec(versionRange)
    const currentVersion = parseVersion(version)
    if (range) {
      compatible = range.containsVersion(currentVersion)
      if (!compatible) {
        const res = range.restrictions[0]
        if (Math.abs(res.lowerBound?.compareTo(currentVersion) ?? 100) === 1 ||
            Math.abs(res.upperBound?.compareTo(currentVersion) ?? 100) === 1) {
          compatible = 'maybe'
        }
      }
    }
    return compatible
  }
  if (dep.semanticVersion) {
    // Resolve semanticVersion compability
    const requirements = dep.semanticVersion
    let compatible: Compatible = 'maybe'
    if (typeof requirements === 'string') {
      compatible = satisfies(version, requirements)
      if (!compatible && id === 'minecraft' && version.split('.').length === 2) {
        compatible = satisfies(version + '.0', requirements)
      }
    } else if (requirements) {
      for (const v of requirements) {
        if (satisfies(version, v)) {
          compatible = true
          break
        }
      }
    }
    return compatible
  }

  return compatible
}

/**
 * Resolve the compatibility of a mod dependencies.
 *
 * @param dependencies All dependencies
 * @param runtime All current mod versions
 */
export function getModsCompatiblity(dependencies: ModDependencies, runtime: Record<string, string>): CompatibleDetail[] {
  const result: CompatibleDetail[] = []
  for (const v of dependencies) {
    const id = v.modId
    const version = runtime[id]
    if (!version) {
      // No such version
      result.push({
        modId: id,
        compatible: false,
        requirements: v.versionRange || v.semanticVersion || '[*]',
        version: '',
      })
    } else {
      result.push({
        modId: id,
        compatible: getModCompatiblity(v, version),
        requirements: v.versionRange || v.semanticVersion || '[*]',
        version,
      })
    }
  }
  return result
}

export function resolveDepsCompatible(com: CompatibleDetail[]): Compatible {
  return resolveCompatible(com.map(v => v.compatible))
}
