import { indexedDBManager } from './IndexedDBManager';
import { VectorizationParams, EditablePathData } from '../../types';

export interface CharacterData {
  unicode: string;
  character: string;
  originalImage?: {
    file: Blob;
    dataUrl: string;
    metadata: {
      fileName: string;
      fileSize: number;
      dimensions: { width: number; height: number };
      uploadTime: Date;
    };
  };
  vectorizedGlyph?: {
    svgPath: string;
    editablePathData: EditablePathData;
    vectorizationParams: VectorizationParams;
    metrics: {
      nodeCount: number;
      pathComplexity: number;
      fileSize: number;
      vectorizationTime: number;
    };
  };
  vectorData?: string; // Simple SVG path string for direct vectorization
  status: 'empty' | 'uploaded' | 'processing' | 'vectorized' | 'complete' | 'error';
  errorMessage?: string;
}

export interface FontProject {
  id: string;
  name: string;
  characterSet: string; // "basic-latin" | "extended-latin" | "custom"
  characters: Map<string, CharacterData>; // Unicode -> CharacterData
  metadata: {
    designer?: string;
    description?: string;
    style?: string;
    version?: string;
  };
  lastModified: Date;
  created: Date;
}

export class CharacterDataStorage {
  constructor() {
    // Ensure IndexedDB is initialized
    this.ensureInitialized();
  }

  private async ensureInitialized(): Promise<void> {
    if (!indexedDBManager['db']) {
      await indexedDBManager.initialize();
    }
  }

  // Character operations
  async storeCharacterData(data: CharacterData): Promise<void> {
    await this.ensureInitialized();
    
    console.log(`💾 Storing character data for ${data.character} (${data.unicode})`);
    
    // Store character metadata
    await indexedDBManager.storeCharacter({
      unicode: data.unicode,
      character: data.character,
      svgPath: data.vectorizedGlyph?.svgPath,
      editablePathData: data.vectorizedGlyph?.editablePathData,
      status: data.status,
      lastModified: new Date(),
      vectorizationParams: data.vectorizedGlyph?.vectorizationParams,
      metrics: data.vectorizedGlyph?.metrics
    });

    // Store original image separately if it exists
    if (data.originalImage) {
      await indexedDBManager.storeImage({
        id: data.unicode,
        blob: data.originalImage.file,
        dataUrl: data.originalImage.dataUrl,
        metadata: data.originalImage.metadata
      });
    }
  }

  async getCharacterData(unicode: string): Promise<CharacterData | null> {
    await this.ensureInitialized();
    
    const characterRecord = await indexedDBManager.getCharacter(unicode);
    if (!characterRecord) {
      return null;
    }

    const imageRecord = await indexedDBManager.getImage(unicode);
    
    const characterData: CharacterData = {
      unicode: characterRecord.unicode,
      character: characterRecord.character,
      status: characterRecord.status
    };

    // Add original image if it exists
    if (imageRecord) {
      characterData.originalImage = {
        file: imageRecord.blob,
        dataUrl: imageRecord.dataUrl,
        metadata: imageRecord.metadata
      };
    }

    // Add vectorized glyph if it exists
    if (characterRecord.svgPath && characterRecord.editablePathData) {
      characterData.vectorizedGlyph = {
        svgPath: characterRecord.svgPath,
        editablePathData: characterRecord.editablePathData,
        vectorizationParams: characterRecord.vectorizationParams || { quality: 'high' },
        metrics: characterRecord.metrics || {
          nodeCount: 0,
          pathComplexity: 0,
          fileSize: 0,
          vectorizationTime: 0
        }
      };
    }

    return characterData;
  }

  async getAllCharacterData(): Promise<CharacterData[]> {
    await this.ensureInitialized();
    
    const characters = await indexedDBManager.getAllCharacters();
    const characterDataArray: CharacterData[] = [];

    for (const char of characters) {
      const fullData = await this.getCharacterData(char.unicode);
      if (fullData) {
        characterDataArray.push(fullData);
      }
    }

    return characterDataArray;
  }

  async getCharactersByStatus(status: CharacterData['status']): Promise<CharacterData[]> {
    await this.ensureInitialized();
    
    const characters = await indexedDBManager.getCharactersByStatus(status);
    const characterDataArray: CharacterData[] = [];

    for (const char of characters) {
      const fullData = await this.getCharacterData(char.unicode);
      if (fullData) {
        characterDataArray.push(fullData);
      }
    }

    return characterDataArray;
  }

  async deleteCharacterData(unicode: string): Promise<void> {
    await this.ensureInitialized();
    
    console.log(`🗑️ Deleting character data for ${unicode}`);
    
    // Delete character record and image
    await Promise.all([
      indexedDBManager.deleteCharacter(unicode),
      indexedDBManager.deleteImage(unicode).catch(() => {
        // Image might not exist, that's okay
      })
    ]);
  }

  async updateCharacterStatus(unicode: string, status: CharacterData['status']): Promise<void> {
    await this.ensureInitialized();
    
    const existing = await indexedDBManager.getCharacter(unicode);
    if (existing) {
      await indexedDBManager.storeCharacter({
        ...existing,
        status,
        lastModified: new Date()
      });
    }
  }

  // Project operations
  async storeProject(project: FontProject): Promise<void> {
    await this.ensureInitialized();
    
    console.log(`💾 Storing project: ${project.name}`);
    
    await indexedDBManager.storeProject({
      id: project.id,
      name: project.name,
      characterSet: project.characterSet,
      characterCount: project.characters.size,
      metadata: project.metadata,
      lastModified: project.lastModified,
      created: project.created
    });

    // Store all character data
    for (const characterData of project.characters.values()) {
      await this.storeCharacterData(characterData);
    }
  }

  async getProject(id: string): Promise<FontProject | null> {
    await this.ensureInitialized();
    
    const projectRecord = await indexedDBManager.getProject(id);
    if (!projectRecord) {
      return null;
    }

    // Get all character data for this project
    const allCharacters = await this.getAllCharacterData();
    const projectCharacters = new Map<string, CharacterData>();
    
    for (const char of allCharacters) {
      projectCharacters.set(char.unicode, char);
    }

    return {
      id: projectRecord.id,
      name: projectRecord.name,
      characterSet: projectRecord.characterSet,
      characters: projectCharacters,
      metadata: projectRecord.metadata,
      lastModified: projectRecord.lastModified,
      created: projectRecord.created
    };
  }

  async getAllProjects(): Promise<FontProject[]> {
    await this.ensureInitialized();
    
    const projectRecords = await indexedDBManager.getAllProjects();
    const projects: FontProject[] = [];

    for (const record of projectRecords) {
      const project = await this.getProject(record.id);
      if (project) {
        projects.push(project);
      }
    }

    return projects;
  }

  async deleteProject(id: string): Promise<void> {
    await this.ensureInitialized();
    
    console.log(`🗑️ Deleting project: ${id}`);
    
    // Get project to find associated characters
    const project = await this.getProject(id);
    if (project) {
      // Delete all character data
      for (const unicode of project.characters.keys()) {
        await this.deleteCharacterData(unicode);
      }
    }

    // Delete project record
    await indexedDBManager.deleteProject(id);
  }

  // Utility methods
  async getStorageStats(): Promise<{
    characterCount: number;
    imageCount: number;
    projectCount: number;
    estimatedSize: string;
    charactersByStatus: Record<string, number>;
  }> {
    await this.ensureInitialized();
    
    const stats = await indexedDBManager.getStorageStats();
    const allCharacters = await indexedDBManager.getAllCharacters();
    
    const charactersByStatus: Record<string, number> = {};
    for (const char of allCharacters) {
      charactersByStatus[char.status] = (charactersByStatus[char.status] || 0) + 1;
    }

    return {
      ...stats,
      charactersByStatus
    };
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    await indexedDBManager.clearAllData();
    console.log('🧹 Cleared all character and project data');
  }
}

// Singleton instance
export const characterDataStorage = new CharacterDataStorage();
