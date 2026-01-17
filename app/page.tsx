'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  abilityEffects,
  buildAbilityFunction,
  buildGiveCommand,
  slugifyNamespace,
  type ModConfig
} from '@/lib/datapack';

type ColorOption = {
  value: string;
  label: string;
};

const colorOptions: ColorOption[] = [
  { value: 'aqua', label: 'Aqua' },
  { value: 'gold', label: 'Gold' },
  { value: 'light_purple', label: 'Magenta' },
  { value: 'green', label: 'Emerald' },
  { value: 'red', label: 'Crimson' }
];

const baseItems = [
  { value: 'diamond_sword', label: 'Diamond Sword' },
  { value: 'netherite_sword', label: 'Netherite Sword' },
  { value: 'iron_sword', label: 'Iron Sword' },
  { value: 'trident', label: 'Trident' }
];

const enchantments = [
  { value: 'sharpness', label: 'Sharpness' },
  { value: 'smite', label: 'Smite' },
  { value: 'bane_of_arthropods', label: 'Bane of Arthropods' },
  { value: 'looting', label: 'Looting' },
  { value: 'fire_aspect', label: 'Fire Aspect' },
  { value: 'knockback', label: 'Knockback' }
];

const secondaryEnchantments = [
  { value: 'looting', label: 'Looting' },
  { value: 'sweeping', label: 'Sweeping Edge' },
  { value: 'fire_aspect', label: 'Fire Aspect' },
  { value: 'unbreaking', label: 'Unbreaking' },
  { value: 'mending', label: 'Mending' }
];

const defaultConfig: ModConfig = {
  modName: 'Emerald Arsenal',
  itemName: 'Emerald Saber',
  baseItem: 'netherite_sword',
  nameColor: 'green',
  abilityName: 'Venom Strike',
  abilityDescription: 'On activation, inflicts poison and empowers the wielder.',
  primaryEnchantment: 'sharpness',
  primaryLevel: 5,
  secondaryEnchantment: 'looting',
  secondaryLevel: 3,
  attackBonus: 6,
  abilityEffect: 'strength',
  abilityDuration: 18,
  abilityAmplifier: 1,
  customModelData: 4217,
  abilityMessage: 'Your Emerald Saber hums with stored energy!'
};

export default function HomePage() {
  const [config, setConfig] = useState<ModConfig>(defaultConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const namespace = useMemo(() => slugifyNamespace(config.modName), [config.modName]);

  const giveCommandPreview = useMemo(() => buildGiveCommand(config, namespace), [config, namespace]);
  const abilityFunctionPreview = useMemo(() => buildAbilityFunction(config), [config]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    try {
      const response = await fetch('/api/datapack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, namespace })
      });

      if (!response.ok) {
        throw new Error('Failed to generate datapack.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${namespace}-datapack.zip`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert('Generation failed. Please adjust your configuration and try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main>
      <section className="card">
        <div className="badge">BlockForge</div>
        <h1 style={{ fontSize: '2.75rem', marginTop: '1.25rem', marginBottom: '1rem' }}>
          Craft a bespoke Minecraft datapack in minutes
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.7 }}>
          Tune a mythical weapon, preview the exact <code>/give</code> command, and download a ready-to-drop
          datapack that installs to your <code>datapacks</code> folder. Deploys cleanly on vanilla Minecraft 1.20+.
        </p>
      </section>

      <form className="card" onSubmit={handleGenerate}>
        <fieldset className="grid two">
          <div>
            <label htmlFor="modName">Mod / Pack Name</label>
            <input
              id="modName"
              value={config.modName}
              onChange={(event) => setConfig((prev) => ({ ...prev, modName: event.target.value }))}
              placeholder="Emerald Arsenal"
              required
            />
            <div className="helper">
              <span className="small">Namespace auto-derives as <code>{namespace}</code></span>
            </div>
          </div>

          <div>
            <label htmlFor="itemName">Signature Item Name</label>
            <input
              id="itemName"
              value={config.itemName}
              onChange={(event) => setConfig((prev) => ({ ...prev, itemName: event.target.value }))}
              placeholder="Emerald Saber"
              required
            />
          </div>
        </fieldset>

        <fieldset className="grid two" style={{ marginTop: '1.75rem' }}>
          <div>
            <label htmlFor="baseItem">Base Item</label>
            <select
              id="baseItem"
              value={config.baseItem}
              onChange={(event) => setConfig((prev) => ({ ...prev, baseItem: event.target.value }))}
            >
              {baseItems.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nameColor">Name Color</label>
            <select
              id="nameColor"
              value={config.nameColor}
              onChange={(event) => setConfig((prev) => ({ ...prev, nameColor: event.target.value }))}
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset style={{ marginTop: '1.75rem' }}>
          <label htmlFor="abilityName">Signature Ability Name</label>
          <input
            id="abilityName"
            value={config.abilityName}
            onChange={(event) => setConfig((prev) => ({ ...prev, abilityName: event.target.value }))}
            placeholder="Venom Strike"
            required
          />
        </fieldset>

        <fieldset style={{ marginTop: '1.5rem' }}>
          <label htmlFor="abilityDescription">Ability Description</label>
          <textarea
            id="abilityDescription"
            value={config.abilityDescription}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, abilityDescription: event.target.value }))
            }
            rows={3}
            placeholder="On activation, inflicts poison and empowers the wielder."
          />
        </fieldset>

        <fieldset className="grid two" style={{ marginTop: '1.75rem' }}>
          <div>
            <label htmlFor="primaryEnchantment">Primary Enchantment</label>
            <select
              id="primaryEnchantment"
              value={config.primaryEnchantment}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, primaryEnchantment: event.target.value }))
              }
            >
              {enchantments.map((enchant) => (
                <option key={enchant.value} value={enchant.value}>
                  {enchant.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="primaryLevel">Level</label>
            <input
              id="primaryLevel"
              type="number"
              min={1}
              max={10}
              value={config.primaryLevel}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, primaryLevel: Number(event.target.value) }))
              }
              required
            />
          </div>
        </fieldset>

        <fieldset className="grid two" style={{ marginTop: '1.5rem' }}>
          <div>
            <label htmlFor="secondaryEnchantment">Secondary Enchantment (optional)</label>
            <select
              id="secondaryEnchantment"
              value={config.secondaryEnchantment ?? ''}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  secondaryEnchantment: event.target.value || undefined
                }))
              }
            >
              <option value="">None</option>
              {secondaryEnchantments.map((enchant) => (
                <option key={enchant.value} value={enchant.value}>
                  {enchant.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="secondaryLevel">Secondary Level</label>
            <input
              id="secondaryLevel"
              type="number"
              min={1}
              max={5}
              value={config.secondaryLevel ?? ''}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  secondaryLevel: event.target.value ? Number(event.target.value) : undefined
                }))
              }
              disabled={!config.secondaryEnchantment}
            />
          </div>
        </fieldset>

        <fieldset className="grid two" style={{ marginTop: '1.5rem' }}>
          <div>
            <label htmlFor="attackBonus">Extra Attack Damage</label>
            <input
              id="attackBonus"
              type="number"
              min={0}
              max={30}
              value={config.attackBonus}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, attackBonus: Number(event.target.value) }))
              }
            />
            <span className="small">Adds attribute bonus (default vanilla sword is +3 to +8).</span>
          </div>
          <div>
            <label htmlFor="customModelData">Custom Model Data (optional)</label>
            <input
              id="customModelData"
              type="number"
              min={1}
              value={config.customModelData ?? ''}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  customModelData: event.target.value ? Number(event.target.value) : undefined
                }))
              }
            />
            <span className="small">Use with a resource pack model override.</span>
          </div>
        </fieldset>

        <fieldset className="grid two" style={{ marginTop: '1.5rem' }}>
          <div>
            <label htmlFor="abilityEffect">Ability Effect</label>
            <select
              id="abilityEffect"
              value={config.abilityEffect}
              onChange={(event) => setConfig((prev) => ({ ...prev, abilityEffect: event.target.value }))}
            >
              {abilityEffects.map((effect) => (
                <option key={effect.id} value={effect.id}>
                  {effect.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="abilityMessage">Activation Message</label>
            <input
              id="abilityMessage"
              value={config.abilityMessage}
              onChange={(event) => setConfig((prev) => ({ ...prev, abilityMessage: event.target.value }))}
              placeholder="Your Emerald Saber hums with stored energy!"
            />
          </div>
        </fieldset>

        <fieldset className="grid two" style={{ marginTop: '1.5rem' }}>
          <div>
            <label htmlFor="abilityDuration">Ability Duration (seconds)</label>
            <input
              id="abilityDuration"
              type="number"
              min={1}
              max={120}
              value={config.abilityDuration}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, abilityDuration: Number(event.target.value) }))
              }
            />
          </div>
          <div>
            <label htmlFor="abilityAmplifier">Ability Amplifier</label>
            <input
              id="abilityAmplifier"
              type="number"
              min={0}
              max={4}
              value={config.abilityAmplifier}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, abilityAmplifier: Number(event.target.value) }))
              }
            />
          </div>
        </fieldset>

        <button className="primary-btn" type="submit" style={{ marginTop: '2.25rem' }} disabled={isGenerating}>
          {isGenerating ? 'Generating datapack…' : 'Download datapack zip'}
        </button>
      </form>

      <section className="card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Preview & Installation</h2>
        <div className="grid" style={{ gap: '1rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.65rem' }}>Generated give command</h3>
            <pre>
              <code>{giveCommandPreview}</code>
            </pre>
          </div>
          <div>
            <h3 style={{ marginBottom: '0.65rem' }}>Ability function contents</h3>
            <pre>
              <code>{abilityFunctionPreview}</code>
            </pre>
          </div>
          <div>
            <h3 style={{ marginBottom: '0.65rem' }}>How to use</h3>
            <ol style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--muted)' }}>
              <li>Unzip your download into <code>.minecraft/saves/your_world/datapacks</code>.</li>
              <li>Launch or re-enter the world. The datapack announces itself on load.</li>
              <li>Run <code>/reload</code> if needed, then execute <code>/function {namespace}:give_item</code>.</li>
              <li>Bind the ability with <code>/function {namespace}:ability</code> whenever you want the power surge.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
