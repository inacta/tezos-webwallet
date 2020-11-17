// Contains relevant information to describe a KISS contract's configuration
export interface IKissDetails {
  activityLogAddress: string; // At which address does the activity log live
  admin: string; // who is the admin of this KISS contract
}

export interface IKissTandemAdminClaim {
  activities: number[];
  helpees: string[];
  helpers: string[];
  minutes: number;
}
