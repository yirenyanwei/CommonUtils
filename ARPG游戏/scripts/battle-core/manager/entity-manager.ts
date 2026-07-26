import { CharacterEntity, Team } from '../entity/character-entity';

// ============================================================
// EntityManager — 实体 CRUD 和查询
// ============================================================

export class EntityManager {
    private readonly entities = new Map<string, CharacterEntity>();
    private idCounter = 0;

    add(entity: CharacterEntity): void {
        this.entities.set(entity.id, entity);
    }

    get(id: string): CharacterEntity | undefined {
        return this.entities.get(id);
    }

    getAll(): CharacterEntity[] {
        return [...this.entities.values()];
    }

    getAllAlive(): CharacterEntity[] {
        return this.getAll().filter(e => e.isAlive);
    }

    getByTeam(team: Team): CharacterEntity[] {
        return this.getAll().filter(e => e.team === team);
    }

    getAliveByTeam(team: Team): CharacterEntity[] {
        return this.getByTeam(team).filter(e => e.isAlive);
    }

    getPlayer(): CharacterEntity | undefined {
        return this.getByTeam('player')[0];
    }

    generateId(prefix: string): string {
        return `${prefix}_${++this.idCounter}`;
    }
}
