import JSZip from 'jszip';
import {
  abilityEffects,
  buildAbilityFunction,
  buildGiveCommand,
  buildLoadFunction,
  slugifyNamespace,
  type DatapackPayload,
  type ModConfig
} from '@/lib/datapack';

const allowedBaseItems = new Set(['diamond_sword', 'netherite_sword', 'iron_sword', 'trident']);
const allowedColors = new Set(['aqua', 'gold', 'light_purple', 'green', 'red']);
const allowedPrimaryEnchants = new Set([
  'sharpness',
  'smite',
  'bane_of_arthropods',
  'looting',
  'fire_aspect',
  'knockback'
]);
const allowedSecondaryEnchants = new Set(['looting', 'sweeping', 'fire_aspect', 'unbreaking', 'mending']);
const allowedEffects = new Set(abilityEffects.map((effect) => effect.id));

function coerceNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<DatapackPayload> | null;
    if (!payload) {
      return new Response('Missing payload', { status: 400 });
    }

    const modName = typeof payload.modName === 'string' && payload.modName.trim().length > 0
      ? payload.modName.trim()
      : 'Custom Arsenal';
    const itemName = typeof payload.itemName === 'string' && payload.itemName.trim().length > 0
      ? payload.itemName.trim()
      : 'Arcane Blade';
    const abilityName = typeof payload.abilityName === 'string' && payload.abilityName.trim().length > 0
      ? payload.abilityName.trim()
      : 'Arcane Pulse';

    const baseItem = typeof payload.baseItem === 'string' && allowedBaseItems.has(payload.baseItem)
      ? payload.baseItem
      : 'diamond_sword';
    const nameColor = typeof payload.nameColor === 'string' && allowedColors.has(payload.nameColor)
      ? payload.nameColor
      : 'aqua';
    const primaryEnchantment = typeof payload.primaryEnchantment === 'string' && allowedPrimaryEnchants.has(payload.primaryEnchantment)
      ? payload.primaryEnchantment
      : 'sharpness';
    const secondaryEnchantment = typeof payload.secondaryEnchantment === 'string' && allowedSecondaryEnchants.has(payload.secondaryEnchantment)
      ? payload.secondaryEnchantment
      : undefined;
    const abilityEffect = typeof payload.abilityEffect === 'string' && allowedEffects.has(payload.abilityEffect)
      ? payload.abilityEffect
      : abilityEffects[0]!.id;

    const namespace = slugifyNamespace(
      typeof payload.namespace === 'string' && payload.namespace.trim().length > 0
        ? payload.namespace
        : modName
    );

    const config: ModConfig = {
      modName,
      itemName,
      baseItem,
      nameColor,
      abilityName,
      abilityDescription:
        typeof payload.abilityDescription === 'string'
          ? payload.abilityDescription.slice(0, 200)
          : 'A bespoke enchantment forged via BlockForge.',
      primaryEnchantment,
      primaryLevel: clamp(coerceNumber(payload.primaryLevel, 5), 1, 10),
      secondaryEnchantment,
      secondaryLevel: secondaryEnchantment
        ? clamp(coerceNumber(payload.secondaryLevel, 3), 1, 10)
        : undefined,
      attackBonus: clamp(coerceNumber(payload.attackBonus, 0), 0, 30),
      abilityEffect,
      abilityDuration: clamp(coerceNumber(payload.abilityDuration, 12), 1, 120),
      abilityAmplifier: clamp(coerceNumber(payload.abilityAmplifier, 0), 0, 10),
      customModelData:
        payload.customModelData !== undefined
          ? clamp(Math.floor(coerceNumber(payload.customModelData, 0)), 1, 9999999)
          : undefined,
      abilityMessage:
        typeof payload.abilityMessage === 'string' && payload.abilityMessage.trim().length > 0
          ? payload.abilityMessage.slice(0, 160)
          : 'Power courses through your veins.'
    };

    const zip = new JSZip();

    const packMeta = {
      pack: {
        pack_format: 26,
        description: `${config.modName} — ${config.itemName}`
      }
    };

    zip.file('pack.mcmeta', `${JSON.stringify(packMeta, null, 2)}\n`);

    const dataFolder = zip.folder('data');
    if (!dataFolder) {
      throw new Error('Unable to initialise datapack structure.');
    }

    const namespaceFolder = dataFolder.folder(namespace)?.folder('functions');
    if (!namespaceFolder) {
      throw new Error('Unable to create namespace directory.');
    }

    namespaceFolder.file('give_item.mcfunction', `${buildGiveCommand(config, namespace)}\n`);
    namespaceFolder.file('ability.mcfunction', `${buildAbilityFunction(config)}\n`);
    namespaceFolder.file('load.mcfunction', `${buildLoadFunction(namespace, config)}\n`);

    const minecraftFolder = dataFolder.folder('minecraft')?.folder('tags')?.folder('functions');
    if (!minecraftFolder) {
      throw new Error('Unable to create minecraft tag directories.');
    }

    minecraftFolder.file('load.json', `${JSON.stringify({ values: [`${namespace}:load`] }, null, 2)}\n`);

    const archiveBuffer = await zip.generateAsync({ type: 'uint8array' });
    const archiveArrayBuffer = archiveBuffer.buffer.slice(
      archiveBuffer.byteOffset,
      archiveBuffer.byteOffset + archiveBuffer.byteLength
    ) as ArrayBuffer;

    return new Response(archiveArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${namespace}-datapack.zip"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('[datapack] generation failed', error);
    return new Response('Failed to generate datapack', { status: 500 });
  }
}
