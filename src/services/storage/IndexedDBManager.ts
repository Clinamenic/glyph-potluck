import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema interface
interface GlyphPotluckDB extends DBSchema {
  characters: {
    key: string; // Unicode (e.g., "U+0041")
    value: {
      unicode: string;
      character: string;
      svgPath?: string;
      editablePathData?: any;
      status: 'empty' | 'uploaded' | 'processing' | 'vectorized' | 'complete' | 'error';
      lastModified: Date;
      vectorizationParams?: any;
      metrics?: any;
    };
    indexes: {
      'by-character': string;
      'by-status': string;
      'by-lastModified': Date;
    };
  };
  images: {
    key: string; // Unicode (e.g., "U+0041")
    value: {
      id: string;
      blob: Blob;
      dataUrl: string;
      metadata: {
        fileName: string;
        fileSize: number;
        dimensions: { width: number; height: number };
        uploadTime: Date;
      };
    };
  };
  projects: {
    key: string; // Project ID
    value: {
      id: string;
      name: string;
      characterSet: string;
      characterCount: number;
      metadata: {
        designer?: string;
        description?: string;
        style?: string;
        version?: string;
      };
      lastModified: Date;
      created: Date;
    };
    indexes: {
      'by-name': string;
      'by-lastModified': Date;
    };
  };
}

export class IndexedDBManager {
  private dbName = 'GlyphPotluckDB';
  private version = 1;
  private db: IDBPDatabase<GlyphPotluckDB> | null = null;

  async initialize(): Promise<void> {
    console.log('🗃️ Initializing IndexedDB storage system...');
    
    try {
      this.db = await openDB<GlyphPotluckDB>(this.dbName, this.version, {
        upgrade(db) {
          console.log('🔧 Creating database schema...');
          
          // Characters store
          if (!db.objectStoreNames.contains('characters')) {
            const characterStore = db.createObjectStore('characters', { 
              keyPath: 'unicode' 
            });
            characterStore.createIndex('by-character', 'character');
            characterStore.createIndex('by-status', 'status');
            characterStore.createIndex('by-lastModified', 'lastModified');
            console.log('✅ Created characters object store');
          }

          // Images store
          if (!db.objectStoreNames.contains('images')) {
            db.createObjectStore('images', { keyPath: 'id' });
            console.log('✅ Created images object store');
          }

          // Projects store
          if (!db.objectStoreNames.contains('projects')) {
            const projectStore = db.createObjectStore('projects', { 
              keyPath: 'id' 
            });
            projectStore.createIndex('by-name', 'name');
            projectStore.createIndex('by-lastModified', 'lastModified');
            console.log('✅ Created projects object store');
          }
        },
      });

      console.log('✅ IndexedDB initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
      throw new Error(`IndexedDB initialization failed: ${error}`);
    }
  }

  private ensureDB(): IDBPDatabase<GlyphPotluckDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Character data operations
  async storeCharacter(characterData: GlyphPotluckDB['characters']['value']): Promise<void> {
    const db = this.ensureDB();
    await db.put('characters', {
      ...characterData,
      lastModified: new Date()
    });
    console.log(`📝 Stored character data for ${characterData.character} (${characterData.unicode})`);
  }

  async getCharacter(unicode: string): Promise<GlyphPotluckDB['characters']['value'] | undefined> {
    const db = this.ensureDB();
    return await db.get('characters', unicode);
  }

  async getAllCharacters(): Promise<GlyphPotluckDB['characters']['value'][]> {
    const db = this.ensureDB();
    return await db.getAll('characters');
  }

  async getCharactersByStatus(status: string): Promise<GlyphPotluckDB['characters']['value'][]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('characters', 'by-status', status);
  }

  async deleteCharacter(unicode: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('characters', unicode);
    console.log(`🗑️ Deleted character data for ${unicode}`);
  }

  // Image operations
  async storeImage(imageData: GlyphPotluckDB['images']['value']): Promise<void> {
    const db = this.ensureDB();
    await db.put('images', imageData);
    console.log(`🖼️ Stored image for character ${imageData.id} (${Math.round(imageData.blob.size / 1024)}KB)`);
  }

  async getImage(unicode: string): Promise<GlyphPotluckDB['images']['value'] | undefined> {
    const db = this.ensureDB();
    return await db.get('images', unicode);
  }

  async deleteImage(unicode: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('images', unicode);
    console.log(`🗑️ Deleted image for character ${unicode}`);
  }

  // Project operations
  async storeProject(projectData: GlyphPotluckDB['projects']['value']): Promise<void> {
    const db = this.ensureDB();
    await db.put('projects', {
      ...projectData,
      lastModified: new Date()
    });
    console.log(`💾 Stored project: ${projectData.name}`);
  }

  async getProject(id: string): Promise<GlyphPotluckDB['projects']['value'] | undefined> {
    const db = this.ensureDB();
    return await db.get('projects', id);
  }

  async getAllProjects(): Promise<GlyphPotluckDB['projects']['value'][]> {
    const db = this.ensureDB();
    return await db.getAll('projects');
  }

  async deleteProject(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('projects', id);
    console.log(`🗑️ Deleted project ${id}`);
  }

  // Utility operations
  async getStorageStats(): Promise<{
    characterCount: number;
    imageCount: number;
    projectCount: number;
    estimatedSize: string;
  }> {
    const db = this.ensureDB();
    
    const characters = await db.getAll('characters');
    const images = await db.getAll('images');
    const projects = await db.getAll('projects');
    
    const totalImageSize = images.reduce((sum, img) => sum + img.blob.size, 0);
    const estimatedSize = this.formatBytes(totalImageSize);

    return {
      characterCount: characters.length,
      imageCount: images.length,
      projectCount: projects.length,
      estimatedSize
    };
  }

  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    
    await db.clear('characters');
    await db.clear('images');
    await db.clear('projects');
    
    console.log('🧹 Cleared all data from IndexedDB');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('🔒 IndexedDB connection closed');
    }
  }
}

// Singleton instance
export const indexedDBManager = new IndexedDBManager();



