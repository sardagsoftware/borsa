/**
 * Personas (Insan-IQ) Commands
 */

import { Command } from 'commander';
import * as ora from 'ora';
import { client } from '../lib/client';
import { authManager } from '../lib/auth';
import { createFormatter } from '../lib/output';
import { handleError, validateRequired, validateEnum } from '../lib/errors';
import { GlobalOptions, Persona, CreatePersonaRequest, PersonaSkill } from '../types';

export function createPersonasCommand(): Command {
  const personas = new Command('personas')
    .description('Manage personas (Insan-IQ module)');

  personas
    .command('create')
    .description('Create a new persona')
    .requiredOption('-n, --name <name>', 'Persona name')
    .requiredOption('-t, --type <type>', 'Persona type (customer, employee, citizen, agent)')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --phone <phone>', 'Phone number')
    .option('-a, --attributes <json>', 'Additional attributes as JSON')
    .option('-s, --skills <skills>', 'Comma-separated list of skills')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(opts.name, 'name');
        validateRequired(opts.type, 'type');
        validateEnum(opts.type, ['customer', 'employee', 'citizen', 'agent'], 'type');

        const request: CreatePersonaRequest = {
          name: opts.name,
          type: opts.type,
          email: opts.email,
          phone: opts.phone
        };

        if (opts.attributes) {
          request.attributes = JSON.parse(opts.attributes);
        }

        if (opts.skills) {
          request.skills = opts.skills.split(',').map((s: string) => s.trim());
        }

        const spinner = ora('Creating persona...').start();
        const response = await client.post<Persona>('/api/personas', request);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to create persona');
        }

        output.success('Persona created successfully');
        output.print(response.data);
        process.exit(0);
      } catch (error) {
        output.error('Failed to create persona', error);
        handleError(error, opts.verbose);
      }
    });

  personas
    .command('list')
    .description('List all personas')
    .option('-t, --type <type>', 'Filter by type')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Fetching personas...').start();
        const response = await client.get<Persona[]>('/api/personas', {
          params: { type: opts.type, limit: opts.limit }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch personas');
        }

        output.print(response.data.map(persona => ({
          ID: persona.id,
          Name: persona.name,
          Type: persona.type,
          Email: persona.email || '-',
          Skills: persona.skills.length,
          Created: persona.created_at
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to list personas', error);
        handleError(error, opts.verbose);
      }
    });

  personas
    .command('get <persona-id>')
    .description('Get persona details')
    .action(async (personaId: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(personaId, 'persona ID');

        const spinner = ora('Fetching persona details...').start();
        const response = await client.get<Persona>(`/api/personas/${personaId}`);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch persona');
        }

        output.print(response.data);
        process.exit(0);
      } catch (error) {
        output.error('Failed to get persona', error);
        handleError(error, opts.verbose);
      }
    });

  personas
    .command('skills <persona-id>')
    .description('Manage persona skills')
    .option('-l, --list', 'List all skills')
    .option('--add <skill>', 'Add a new skill')
    .option('--remove <skill-id>', 'Remove a skill')
    .option('--publish <skill-id>', 'Publish a skill')
    .action(async (personaId: string, opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(personaId, 'persona ID');

        // List skills
        if (opts.list || (!opts.add && !opts.remove && !opts.publish)) {
          const spinner = ora('Fetching persona skills...').start();
          const response = await client.get<PersonaSkill[]>(`/api/personas/${personaId}/skills`);
          spinner.stop();

          if (!response.success || !response.data) {
            throw new Error('Failed to fetch skills');
          }

          output.print(response.data.map(skill => ({
            ID: skill.id,
            Name: skill.name,
            Category: skill.category,
            Proficiency: skill.proficiency,
            Verified: skill.verified,
            Created: skill.created_at
          })));
        }

        // Add skill
        if (opts.add) {
          const spinner = ora('Adding skill...').start();
          const response = await client.post<PersonaSkill>(
            `/api/personas/${personaId}/skills`,
            { name: opts.add }
          );
          spinner.stop();

          if (!response.success || !response.data) {
            throw new Error('Failed to add skill');
          }

          output.success('Skill added successfully');
          output.print(response.data);
        }

        // Remove skill
        if (opts.remove) {
          const spinner = ora('Removing skill...').start();
          const response = await client.delete(`/api/personas/${personaId}/skills/${opts.remove}`);
          spinner.stop();

          if (!response.success) {
            throw new Error('Failed to remove skill');
          }

          output.success('Skill removed successfully');
        }

        // Publish skill
        if (opts.publish) {
          const spinner = ora('Publishing skill...').start();
          const response = await client.post(
            `/api/personas/${personaId}/skills/${opts.publish}/publish`
          );
          spinner.stop();

          if (!response.success) {
            throw new Error('Failed to publish skill');
          }

          output.success('Skill published successfully');
        }

        process.exit(0);
      } catch (error) {
        output.error('Failed to manage skills', error);
        handleError(error, opts.verbose);
      }
    });

  return personas;
}
