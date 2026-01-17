export type AbilityEffect = {
  id: string;
  label: string;
  statusLore: string;
  supportsAmplifier: boolean;
  command: (duration: number, amplifier: number) => string;
};

export type ModConfig = {
  modName: string;
  itemName: string;
  baseItem: string;
  nameColor: string;
  abilityName: string;
  abilityDescription: string;
  primaryEnchantment: string;
  primaryLevel: number;
  secondaryEnchantment?: string;
  secondaryLevel?: number;
  attackBonus: number;
  abilityEffect: string;
  abilityDuration: number;
  abilityAmplifier: number;
  customModelData?: number;
  abilityMessage: string;
};

export type DatapackPayload = ModConfig & {
  namespace: string;
};

export const abilityEffects: AbilityEffect[] = [
  {
    id: 'strength',
    label: 'Berserker Surge (Strength)',
    statusLore: 'Trigger to unleash a Strength boost.',
    supportsAmplifier: true,
    command: (duration, amplifier) =>
      `effect give @s minecraft:strength ${duration} ${amplifier} true`
  },
  {
    id: 'speed',
    label: 'Windstep (Speed)',
    statusLore: 'Trigger to dash forward with Speed.',
    supportsAmplifier: true,
    command: (duration, amplifier) => `effect give @s minecraft:speed ${duration} ${amplifier} true`
  },
  {
    id: 'regeneration',
    label: 'Emerald Renewal (Regeneration)',
    statusLore: 'Trigger instant Regeneration to recover health.',
    supportsAmplifier: true,
    command: (duration, amplifier) =>
      `effect give @s minecraft:regeneration ${duration} ${amplifier} true`
  },
  {
    id: 'night_vision',
    label: 'Void Sight (Night Vision)',
    statusLore: 'Trigger to pierce the darkness with Night Vision.',
    supportsAmplifier: false,
    command: (duration) => `effect give @s minecraft:night_vision ${duration} 0 true`
  }
];

export function slugifyNamespace(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'custom_mod';
}

function toTextComponentSnbt(component: Record<string, unknown>): string {
  return `'${JSON.stringify(component).replace(/'/g, "\\'")}'`;
}

function resolveAbility(effectId: string): AbilityEffect {
  return abilityEffects.find((effect) => effect.id === effectId) ?? abilityEffects[0];
}

function deriveUuidInts(seed: string): [number, number, number, number] {
  const defaults: [number, number, number, number] = [
    14602819,
    8319051,
    4019287,
    9912741
  ];
  if (!seed) {
    return defaults;
  }

  const values = seed
    .split('')
    .map((char, index) => char.charCodeAt(0) * (index + 11))
    .slice(0, 4);

  return [
    values[0] ?? defaults[0],
    values[1] ?? defaults[1],
    values[2] ?? defaults[2],
    values[3] ?? defaults[3]
  ];
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function buildGiveCommand(config: ModConfig, namespace: string): string {
  const ability = resolveAbility(config.abilityEffect);
  const loreComponents: string[] = [
    toTextComponentSnbt({ text: config.abilityName, color: config.nameColor, italic: false }),
    toTextComponentSnbt({ text: config.abilityDescription, color: 'gray', italic: false }),
    toTextComponentSnbt({ text: ability.statusLore, color: 'dark_green', italic: false })
  ];

  const enchantList: string[] = [];
  enchantList.push(`{id:"minecraft:${config.primaryEnchantment}",lvl:${clampNumber(config.primaryLevel, 1, 10)}s}`);
  if (config.secondaryEnchantment && config.secondaryLevel) {
    enchantList.push(
      `{id:"minecraft:${config.secondaryEnchantment}",lvl:${clampNumber(config.secondaryLevel, 1, 10)}s}`
    );
  }

  const attackBonus = clampNumber(config.attackBonus, 0, 30);
  const uuid = deriveUuidInts(namespace);

  const displaySection = `{Name:${toTextComponentSnbt({ text: config.itemName, color: config.nameColor, italic: false })},Lore:[${loreComponents.join(',')}]}`;

  const rootEntries = [
    `display:${displaySection}`,
    `Enchantments:[${enchantList.join(',')}]`,
    'HideFlags:127'
  ];

  if (attackBonus) {
    rootEntries.push(
      `AttributeModifiers:[{AttributeName:"generic.attack_damage",Name:"custom.attack_bonus",Amount:${attackBonus},Operation:0,UUID:[I,${uuid[0]},${uuid[1]},${uuid[2]},${uuid[3]}],Slot:"mainhand"}]`
    );
  }

  if (config.customModelData) {
    rootEntries.push(`CustomModelData:${config.customModelData}`);
  }

  return `give @s minecraft:${config.baseItem}{${rootEntries.join(',')}}`;
}

export function buildAbilityFunction(config: ModConfig): string {
  const ability = resolveAbility(config.abilityEffect);
  const duration = clampNumber(config.abilityDuration, 1, 120);
  const amplifier = ability.supportsAmplifier
    ? clampNumber(config.abilityAmplifier, 0, 10)
    : 0;
  const sanitizedMessage = config.abilityMessage.replace(/"/g, '\\"');

  return [
    `say ${config.abilityName} activated!`,
    `tellraw @s {"text":"${sanitizedMessage}","color":"${config.nameColor}","italic":false}`,
    ability.command(duration, amplifier)
  ].join('\n');
}

export function buildLoadFunction(namespace: string, config: ModConfig): string {
  const sanitizedItemName = config.itemName.replace(/"/g, '\\"');
  return [
    `tellraw @a {"text":"${config.modName} loaded. Use /function ${namespace}:give_item to claim the ${sanitizedItemName}.","color":"aqua","italic":false}`
  ].join('\n');
}
