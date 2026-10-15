import {
  createOwnerTenantAction,
  removeTenantAction,
  saveOwnerProfileAction,
  saveOwnerSettingsAction,
  setOwnerStatusAction,
} from '../actions';
import { BrandingForm } from '../[tenant]/dashboard/BrandingForm';
import { deriveBrand, parseHex } from '@/cu/contrast';
import { STATUS_ACTIVE, STATUS_PAUSED, type StoredTenantProfile } from '@/cu/tenant-directory';

const field = 'mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal';
const label = 'text-[14px] font-semibold leading-[20px]';
const button = 'cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto';
const danger = 'cu-danger inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto';
const outline = 'inline-flex h-12 w-full items-center justify-center rounded-lg border cu-line bg-white px-4 text-[15px] font-semibold md:h-11 md:w-auto';
const textButton = 'cu-link text-[15px] font-semibold underline decoration-1 underline-offset-4 cu-linkline';

function TextField({
  name, title, defaultValue, required,
}: {
  name: string;
  title: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className={label}>{title}
      <input name={name} defaultValue={defaultValue ?? ''} required={required} className={field} />
    </label>
  );
}

export function OwnerEditor({
  mode,
  profile,
  shortName,
  primary,
  secondary,
  logoLight,
  logoDark,
  emailEnabled,
  notifyEmail,
  notice,
  askForSite = false,
}: {
  mode: 'create' | 'edit' | 'confirm' | 'pause';
  profile: StoredTenantProfile | null;
  shortName: string;
  primary: string;
  secondary: string;
  logoLight: string;
  logoDark: string;
  emailEnabled: boolean;
  notifyEmail: string;
  notice: { tone: 'ok' | 'err'; text: string } | null;
  askForSite?: boolean;
}) {
  if (mode === 'pause' && profile) {
    return (
      <section aria-labelledby="pause-heading" className="max-w-[560px]">
        <h1 id="pause-heading" className="text-[32px] font-bold leading-[38px]">Pause {profile.name}?</h1>
        <p className="mt-4 text-[15px] leading-[24px]">Members see an unavailable page. The dashboard stays open.</p>
        <form action={setOwnerStatusAction} className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
          <input type="hidden" name="tenant" value={profile.id} />
          <input type="hidden" name="status" value="paused" />
          <input type="hidden" name="confirm" value="pause" />
          <button type="submit" className={button}>{'Pause'}</button>
          <a href={`/cu/admin?cu=${profile.id}`} className={outline}>Cancel</a>
        </form>
      </section>
    );
  }

  if (mode === 'confirm' && profile) {
    return (
      <section aria-labelledby="remove-heading" className="max-w-[560px]">
        <h1 id="remove-heading" className="text-[32px] font-bold leading-[38px]">Remove {profile.name}?</h1>
        <p className="mt-4 text-[15px] leading-[24px]">This removes the credit-union profile, branding, settings, and counts. Member data is not stored.</p>
        <form action={removeTenantAction} className="mt-6 grid gap-4">
          <input type="hidden" name="tenant" value={profile.id} />
          <input type="hidden" name="confirm" value="remove" />
          <label className={label}>Type {profile.id} to remove
            <input name="confirmId" autoComplete="off" required className={field} />
          </label>
          {notice ? <p className="cu-err" role="alert">{notice.text}</p> : null}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <button type="submit" className={danger}>Remove</button>
            <a href={`/cu/admin?cu=${profile.id}`} className={outline}>Cancel</a>
          </div>
        </form>
      </section>
    );
  }

  return (
    <div className="grid max-w-[560px] gap-10">
      {notice ? (
        <p className={notice.tone === 'ok' ? 'cu-ok' : 'cu-err'} role={notice.tone === 'ok' ? 'status' : 'alert'}>{notice.text}</p>
      ) : null}

      {mode === 'create' ? (
        <section aria-labelledby="add-heading">
          <h1 id="add-heading" className="text-[32px] font-bold leading-[38px]">Add credit union</h1>
          <form action={createOwnerTenantAction} className="mt-6 grid gap-4">
            <TextField name="id" title="Slug" required />
            <TextField name="name" title="Name" required />
            <TextField name="legalName" title="Legal name" />
            <TextField name="shortName" title="Short name" required />
            <TextField name="primary" title="Primary" required />
            <TextField name="tagline" title="Tagline" />
            <TextField name="preApprovalUrl" title="Pre-approval URL" required />
            <TextField name="ratesUrl" title="Rates URL" required />
            <TextField name="supportUrl" title="Support URL" />
            <TextField name="privacyUrl" title="Privacy URL" />
            <TextField name="preApprovalLabel" title="Pre-approval label" />
            <TextField name="ratesLabel" title="Rates label" />
            <button type="submit" className={button}>Add credit union</button>
          </form>
        </section>
      ) : null}

      {mode === 'edit' && profile ? (
        <>
          <section aria-labelledby="profile-heading">
            <h1 id="profile-heading" className="text-[32px] font-bold leading-[38px]">{profile.name}</h1>
            <p className="mt-2 text-[14px] leading-[20px] cu-muted">{profile.status === 'paused' ? STATUS_PAUSED : STATUS_ACTIVE} {profile.id}</p>
            <form action={saveOwnerProfileAction} className="mt-6 grid gap-4">
              <input type="hidden" name="tenant" value={profile.id} />
              <TextField name="name" title="Name" defaultValue={profile.name} required />
              <TextField name="legalName" title="Legal name" defaultValue={profile.legalName} required />
              <TextField name="tagline" title="Tagline" defaultValue={profile.tagline} required />
              <TextField name="preApprovalUrl" title="Pre-approval URL" defaultValue={profile.preApprovalUrl} required />
              <TextField name="ratesUrl" title="Rates URL" defaultValue={profile.ratesUrl} required />
              <TextField name="supportUrl" title="Support URL" defaultValue={profile.supportUrl} required />
              <TextField name="privacyUrl" title="Privacy URL" defaultValue={profile.privacyUrl} required />
              <TextField name="preApprovalLabel" title="Pre-approval label" defaultValue={profile.preApprovalLabel} required />
              <TextField name="ratesLabel" title="Rates label" defaultValue={profile.ratesLabel} required />
              <button type="submit" className={button}>Save profile</button>
            </form>
          </section>

          <section aria-labelledby="branding-heading">
            <h2 id="branding-heading" className="text-[24px] font-bold leading-[30px]">Branding</h2>
            <BrandingForm
              tenantId={profile.id}
              shortName={shortName}
              primary={primary}
              secondary={secondary}
              logoLight={logoLight}
              logoDark={logoDark}
              returnTo="owner"
            />
          </section>

          <section id="settings" aria-labelledby="settings-heading">
            <h2 id="settings-heading" className="text-[24px] font-bold leading-[30px]">Settings</h2>
            {profile.embedOrigins.length === 0 ? <SiteBanner primary={primary} id={profile.id} name={profile.name} shortName={shortName} /> : null}
            <form action={saveOwnerSettingsAction} className="mt-6 grid gap-4">
              <input type="hidden" name="tenant" value={profile.id} />
              <label className="flex items-center gap-2 text-[15px] font-semibold">
                <input type="checkbox" name="emailEnabled" defaultChecked={emailEnabled} />
                Email aggregate summaries
              </label>
              <p className="text-[14px] leading-[20px] cu-muted">Off by default. Summaries contain counts only.</p>
              <label className={label}>Credit-union inbox
                <input name="notifyEmail" type="email" defaultValue={notifyEmail} autoComplete="off" className={field} />
              </label>
              <label className={label}>Embed allowlist
                <textarea
                  id="embed-allowlist"
                  name="embedOrigins"
                  defaultValue={profile.embedOrigins.join('\n')}
                  rows={4}
                  autoFocus={askForSite}
                  className="mt-2 block w-full rounded-lg border cu-line px-4 py-3 text-[16px] font-normal"
                />
              </label>
              <p className="text-[14px] leading-[20px] cu-muted">One https origin per line. This site can always frame the check.</p>
              <button type="submit" className={button}>Save settings</button>
            </form>
          </section>

          <section aria-labelledby="staff-heading">
            <h2 id="staff-heading" className="text-[24px] font-bold leading-[30px]">Staff access</h2>
            <p className="mt-2 text-[14px] leading-[20px] cu-muted">Staff who start a trial sign in with the email and password from signup.</p>
          </section>

          <section aria-labelledby="status-heading">
            <h2 id="status-heading" className="text-[24px] font-bold leading-[30px]">Pause and remove</h2>
            <p className="mt-2 text-[14px] leading-[20px] cu-muted">Paused credit unions show an unavailable page. The dashboard stays open.</p>
            {profile.status === 'paused' ? (
              <form action={setOwnerStatusAction} className="mt-4">
                <input type="hidden" name="tenant" value={profile.id} />
                <input type="hidden" name="status" value="active" />
                <button type="submit" className={textButton}>Resume</button>
              </form>
            ) : (
              <p className="mt-4">
                <a href={`/cu/admin?cu=${profile.id}&confirm=pause`} className={textButton}>{'Pause'}</a>
              </p>
            )}
            <p className="mt-4">
              <a href={`/cu/admin?cu=${profile.id}&confirm=remove`} className="cu-danger-link text-[15px] font-semibold underline decoration-1 underline-offset-4">Remove credit union</a>
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

function SiteBanner({
  primary, id, name, shortName,
}: {
  primary: string;
  id: string;
  name: string;
  shortName: string;
}) {
  const derived = deriveBrand(id, {
    name,
    shortName: shortName || name,
    primary: /^#[0-9a-fA-F]{6}$/.test(primary) ? primary : '#111111',
    logoAspect: 1,
  }, () => undefined);
  const rgb = parseHex(derived.primary);
  const tint = rgb ? `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / 0.06)` : 'rgb(17 17 17 / 0.06)';
  return (
    <div
      className="mt-4 rounded-lg border px-4 py-4 text-[14px] leading-[20px]"
      style={{ background: tint, borderColor: derived.brandText }}
      role="status"
    >
      <p>Add at least one website that can show the tool.</p>
      <label htmlFor="embed-allowlist" className={`${button} mt-3`}>Add website</label>
    </div>
  );
}
