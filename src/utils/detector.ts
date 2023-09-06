import * as levenshtein from 'fast-levenshtein';

interface LegacyPhishingDetectorConfiguration {
  whitelist: string[];
  blacklist: string[];
  fuzzylist: string[];
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 3;

export class PhishingDetector {
  configs: { allowlist: any; blocklist: any; fuzzylist: any; tolerance: number | undefined }[];
  legacyConfig: boolean;
  constructor(opts: LegacyPhishingDetectorConfiguration | LegacyPhishingDetectorConfiguration[]) {
    // recommended configuration
    if (Array.isArray(opts)) {
      this.configs = processConfigs(opts);
      this.legacyConfig = false;
      // legacy configuration
    } else {
      this.configs = [
        {
          allowlist: processDomainList(opts.whitelist || []),
          blocklist: processDomainList(opts.blacklist || []),
          fuzzylist: processDomainList(opts.fuzzylist || []),
          tolerance: 'tolerance' in opts ? opts.tolerance : DEFAULT_TOLERANCE,
        },
      ];
      this.legacyConfig = true;
    }
  }

  check(domain: any) {
    const result = this._check(domain);

    if (this.legacyConfig) {
      let legacyType = result.type;
      if (legacyType === 'allowlist') {
        legacyType = 'whitelist';
      } else if (legacyType === 'blocklist') {
        legacyType = 'blacklist';
      }
      return {
        match: result.match,
        result: result.result,
        type: legacyType,
      };
    }
    return result;
  }

  _check(domain: any) {
    const fqdn = domain.substring(domain.length - 1) === '.' ? domain.slice(0, -1) : domain;

    const source = domainToParts(fqdn);

    for (const { allowlist } of this.configs) {
      // if source matches allowlist hostname (or subdomain thereof), PASS
      const allowlistMatch = matchPartsAgainstList(source, allowlist);
      if (allowlistMatch) {
        const match = domainPartsToDomain(allowlistMatch);
        return { match, result: false, type: 'allowlist' };
      }
    }

    for (const { blocklist, fuzzylist, tolerance } of this.configs) {
      // if source matches blocklist hostname (or subdomain thereof), FAIL
      const blocklistMatch = matchPartsAgainstList(source, blocklist);
      if (blocklistMatch) {
        const match = domainPartsToDomain(blocklistMatch);
        return { match, result: true, type: 'blocklist' };
      }

      if (tolerance && tolerance > 0) {
        // check if near-match of whitelist domain, FAIL
        let fuzzyForm = domainPartsToFuzzyForm(source);
        // strip www
        fuzzyForm = fuzzyForm.replace('www.', '');
        // check against fuzzylist
        const levenshteinMatched = fuzzylist.find((targetParts: any[]) => {
          const fuzzyTarget = domainPartsToFuzzyForm(targetParts);
          const distance = levenshtein.get(fuzzyForm, fuzzyTarget);
          return distance <= tolerance;
        });
        if (levenshteinMatched) {
          const match = domainPartsToDomain(levenshteinMatched);
          return { match, result: true, type: 'fuzzy' };
        }
      }
    }

    // matched nothing, PASS
    return { result: false, type: 'all' };
  }
}

// module.exports = PhishingDetector

// util

function processConfigs(configs: LegacyPhishingDetectorConfiguration[] = []) {
  return configs.map((config) => {
    validateConfig(config);
    return Object.assign({}, config, {
      allowlist: processDomainList(config.whitelist || []),
      blocklist: processDomainList(config.blacklist || []),
      fuzzylist: processDomainList(config.fuzzylist || []),
      tolerance: 'tolerance' in config ? config.tolerance : DEFAULT_TOLERANCE,
    });
  });
}

function validateConfig(config: any) {
  if (config === null || typeof config !== 'object') {
    throw new Error('Invalid config');
  }

  if (config.tolerance && !config.fuzzylist) {
    throw new Error('Fuzzylist tolerance provided without fuzzylist');
  }
}

function processDomainList(list: any[]) {
  return list.map(domainToParts);
}

function domainToParts(domain: string) {
  try {
    return domain.split('.').reverse();
  } catch (e) {
    throw new Error(JSON.stringify(domain));
  }
}

function domainPartsToDomain(domainParts: any[]) {
  return domainParts.slice().reverse().join('.');
}

// for fuzzy search, drop TLD and re-stringify
function domainPartsToFuzzyForm(domainParts: any[]) {
  return domainParts.slice(1).reverse().join('.');
}

// match the target parts, ignoring extra subdomains on source
// returns parts for first found matching entry
//   source: [io, metamask, xyz]
//   target: [io, metamask]
//   result: PASS
function matchPartsAgainstList(source: any[], list: any[]) {
  return list.find((target) => {
    // target domain has more parts than source, fail
    if (target.length > source.length) return false;
    // source matches target or (is deeper subdomain)
    return target.every((part: any, index: number) => source[index] === part);
  });
}
