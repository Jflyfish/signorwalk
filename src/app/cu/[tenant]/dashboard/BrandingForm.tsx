'use client';

import { useState } from 'react';
import { deriveBrand, type DerivedBrand } from '@/cu/contrast';
import { saveBrandingAction } from '../../actions';

const HEX = /^#[0-9a-fA-F]{6}$/;

function previewBrand(tenantId: string, shortName: string, primary: string): DerivedBrand | null {
  if (!HEX.test(primary)) return null;
  return deriveBrand(tenantId, {
    name: shortName,
    shortName,
    primary,
    logoAspect: 1,
  }, () => {});
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div>
      <span className="block h-6 w-6" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="mt-2 block text-[14px] leading-[20px] text-[#555]">{label}</span>
    </div>
  );
}

function LogoStage({ src, dark }: { src: string; dark?: boolean }) {
  if (!src) return null;
  return (
    <div className={`mt-2 inline-flex items-center ${dark ? 'bg-[#111] px-3 py-2' : 'bg-white'}`}>
      <img src={src} alt="" className="h-8 w-auto max-w-[160px] object-contain" />
    </div>
  );
}

export function BrandingForm({
  tenantId,
  shortName,
  primary,
  secondary,
  logoLight,
  logoDark,
}: {
  tenantId: string;
  shortName: string;
  primary: string;
  secondary: string;
  logoLight: string;
  logoDark: string;
}) {
  const [color, setColor] = useState(primary);
  const [name, setName] = useState(shortName);
  const [lightSrc, setLightSrc] = useState(logoLight);
  const [darkSrc, setDarkSrc] = useState(logoDark);
  const derived = previewBrand(tenantId, name || shortName, color);

  function stage(file: File | undefined, set: (src: string) => void) {
    if (!file || file.size === 0) return;
    set(URL.createObjectURL(file));
  }

  return (
    <form action={saveBrandingAction} className="mt-6 grid max-w-[560px] gap-4">
      <input type="hidden" name="tenant" value={tenantId} />
      {derived ? (
        <div>
          <div className="flex gap-6">
            <Swatch label="Text" color={derived.brandText} />
            <Swatch label="Button" color={derived.brandFill} />
            <Swatch label="Focus" color={derived.focus} />
          </div>
          <button
            type="button"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg px-4 text-[15px] font-semibold"
            style={{ backgroundColor: derived.brandFill, color: derived.onBrand }}
          >
            Primary button
          </button>
        </div>
      ) : null}
      <label className="text-[14px] font-semibold leading-[20px]">Short name
        <input
          name="shortName"
          value={name}
          onChange={event => setName(event.target.value)}
          maxLength={24}
          required
          className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal"
        />
      </label>
      <label className="text-[14px] font-semibold leading-[20px]">Primary
        <input
          name="primary"
          value={color}
          onChange={event => setColor(event.target.value.trim())}
          required
          className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal"
        />
      </label>
      <label className="text-[14px] font-semibold leading-[20px]">Secondary
        <input name="secondary" defaultValue={secondary} className="mt-2 block h-12 w-full rounded-lg border border-[#E5E5E5] px-4 text-[16px] font-normal" />
      </label>
      <div>
        <label className="text-[14px] font-semibold leading-[20px]">Logo
          <input
            name="logoLightFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={event => stage(event.target.files?.[0], setLightSrc)}
            className="mt-2 block w-full text-[15px] font-normal"
          />
        </label>
        <LogoStage src={lightSrc} />
      </div>
      <div>
        <label className="text-[14px] font-semibold leading-[20px]">Logo for dark backgrounds
          <input
            name="logoDarkFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={event => stage(event.target.files?.[0], setDarkSrc)}
            className="mt-2 block w-full text-[15px] font-normal"
          />
        </label>
        {darkSrc ? <LogoStage src={darkSrc} dark /> : null}
      </div>
      <button type="submit" className="cu-primary inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save branding</button>
    </form>
  );
}
