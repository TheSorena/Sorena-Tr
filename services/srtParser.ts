
import { SubtitleBlock } from '../types';

export const parseSRT = (content: string): SubtitleBlock[] => {
  const blocks: SubtitleBlock[] = [];
  // Split by double or more newlines to handle irregular spacing between blocks
  const rawBlocks = content.trim().split(/\r?\n\r?\n+/);

  rawBlocks.forEach((block, idx) => {
    const lines = block.split(/\r?\n/).map(l => l.trim());
    if (lines.length >= 3) {
      const index = lines[0];
      const timestamp = lines[1];
      const text = lines.slice(2).filter(line => line.length > 0).join('\n');
      
      // Simple validation of SRT block structure
      if (index && timestamp.includes('-->') && text) {
        blocks.push({
          id: `block-${idx}`,
          index,
          timestamp,
          text
        });
      }
    }
  });

  return blocks;
};

export const chunkBlocks = (blocks: SubtitleBlock[], chunkSize: number = 30): SubtitleBlock[][] => {
  const chunks: SubtitleBlock[][] = [];
  for (let i = 0; i < blocks.length; i += chunkSize) {
    chunks.push(blocks.slice(i, i + chunkSize));
  }
  return chunks;
};

export const rebuildSRT = (translatedBlocks: SubtitleBlock[]): string => {
  return translatedBlocks
    .map(block => `${block.index}\n${block.timestamp}\n${block.text}`)
    .join('\n\n');
};
