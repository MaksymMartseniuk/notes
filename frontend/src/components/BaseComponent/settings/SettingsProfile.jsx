
import DeleteAccount from "./DeleteAccount";
import AccountSecurity from './AccountSecurity'

export default function SettingsProfile() {
  return (
    <div className="settings-profile">
      <h3>User profile</h3>
      <AccountSecurity/>
      <DeleteAccount />
    </div>
  );
}
