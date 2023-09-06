export enum BlacklistSource {
  SYSTEM = 0,
  REPORT = 1,
  PUBLIC_DB = 2,
}

export enum BlacklistStatus {
  PENDING = 0,
  CONFIRMED = 1,
  RISK_FREE = 2,
}

export enum Scam {
  ETH_SIGN = 'eth_sign',
  GASLESS_TRANSACTION = 'gasless_transaction',
  UPGRADE_TO = 'upgrade_to',
  HONEYPOT = 'honeypot',
  SECURITY_UPDATE = 'security_update',
  FAKE_TOKEN = 'fake_token',
  BURN_RISK = 'burn',
}
