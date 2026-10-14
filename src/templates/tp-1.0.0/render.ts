import { SLOTS, type Slot, type Template } from './en';

const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;

/** Credit-union names and state names are taken from our config and state list, not from the member. */
const NAME_SLOT = /^(creditUnionName|stateName)$/;
const NAME_VALUE = /^[A-Za-z0-9][A-Za-z0-9 '&.,-]{0,80}$/;
const NUMBER_VALUE = /^[\d$%.,\-]+$/;

export function renderTemplate(template: Template, values: Partial<Record<Slot, string>>): string {
  return template.text.replace(PLACEHOLDER, (match, key: string) => {
    if (!(SLOTS as readonly string[]).includes(key)) {
      throw new Error(`Unknown slot {${key}} in ${template.id}`);
    }
    if (!(template.slots as readonly string[]).includes(key)) {
      throw new Error(`Undeclared slot {${key}} in ${template.id}`);
    }
    const value = values[key as Slot];
    if (value === undefined || value === '') {
      throw new Error(`Missing slot {${key}} in ${template.id}`);
    }
    const ok = NAME_SLOT.test(key) ? NAME_VALUE.test(value) : NUMBER_VALUE.test(value);
    if (!ok) throw new Error(`Rejected slot value for {${key}} in ${template.id}`);
    return value;
  });
}

export function templatePlaceholders(template: Template): string[] {
  return [...template.text.matchAll(PLACEHOLDER)].map(m => m[1]);
}
