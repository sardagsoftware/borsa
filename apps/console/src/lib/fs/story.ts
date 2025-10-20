/**
 * Story File System Reader (Server-Side Only)
 * Reads story bible files from /story directory
 *
 * White-hat: Local file system only, no external sources
 * KVKK/GDPR/PDPL: No PII, metadata only
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface StoryData {
  bibleMd: string | null;
  timeline: any | null;
  characters: any | null;
  themes: any | null;
  dialogueMd: string | null;
  palette: any | null;
  tagsYaml: string | null;
  tagsData: any | null;
}

/**
 * Read all story files from /story directory
 * @returns StoryData object with all story bible content
 */
export async function readStoryFiles(): Promise<StoryData> {
  const root = path.join(process.cwd(), '../../story');

  // Helper to load text file
  const loadText = async (filename: string): Promise<string | null> => {
    try {
      return await fs.readFile(path.join(root, filename), 'utf-8');
    } catch (error) {
      console.error(`Failed to load ${filename}:`, error);
      return null;
    }
  };

  // Helper to load JSON file
  const loadJson = async (filename: string): Promise<any | null> => {
    try {
      const content = await fs.readFile(path.join(root, filename), 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load JSON ${filename}:`, error);
      return null;
    }
  };

  // Load all story files
  const [
    bibleMd,
    timeline,
    characters,
    themes,
    dialogueMd,
    palette,
    tagsYaml
  ] = await Promise.all([
    loadText('story-bible.md'),
    loadJson('story-timeline.json'),
    loadJson('characters.json'),
    loadJson('themes.json'),
    loadText('dialogue-samples.md'),
    loadJson('aesthetic-palette.json'),
    loadText('telemetry-tags.yaml')
  ]);

  // Parse YAML tags
  let tagsData: any | null = null;
  if (tagsYaml) {
    try {
      tagsData = yaml.load(tagsYaml) as any;
    } catch (error) {
      console.error('Failed to parse telemetry-tags.yaml:', error);
    }
  }

  return {
    bibleMd,
    timeline,
    characters,
    themes,
    dialogueMd,
    palette,
    tagsYaml,
    tagsData
  };
}

/**
 * Check if story files exist
 * @returns boolean
 */
export async function checkStoryFilesExist(): Promise<boolean> {
  const root = path.join(process.cwd(), '../../story');
  try {
    await fs.access(path.join(root, 'story-bible.md'));
    return true;
  } catch {
    return false;
  }
}
