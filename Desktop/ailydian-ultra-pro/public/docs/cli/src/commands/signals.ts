/**
 * Signals (LyDian-IQ) Commands
 */

import { Command } from 'commander';
import * as ora from 'ora';
import { client } from '../lib/client';
import { authManager } from '../lib/auth';
import { createFormatter } from '../lib/output';
import { handleError, validateRequired, validateEnum } from '../lib/errors';
import { GlobalOptions, Signal, SendSignalRequest, SignalInsight, KnowledgeGraph } from '../types';

export function createSignalsCommand(): Command {
  const signals = new Command('signals')
    .description('Manage signals (LyDian-IQ module)');

  signals
    .command('send')
    .description('Send a new signal')
    .requiredOption('-t, --type <type>', 'Signal type (metric, event, alert, insight)')
    .requiredOption('-d, --data <json>', 'Signal data as JSON')
    .option('-s, --source <source>', 'Signal source')
    .option('-m, --metadata <json>', 'Additional metadata as JSON')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(opts.type, 'type');
        validateRequired(opts.data, 'data');
        validateEnum(opts.type, ['metric', 'event', 'alert', 'insight'], 'type');

        const request: SendSignalRequest = {
          type: opts.type,
          data: JSON.parse(opts.data),
          source: opts.source
        };

        if (opts.metadata) {
          request.metadata = JSON.parse(opts.metadata);
        }

        const spinner = ora('Sending signal...').start();
        const response = await client.post<Signal>('/api/signals', request);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to send signal');
        }

        output.success('Signal sent successfully');
        output.print(response.data);
        process.exit(0);
      } catch (error) {
        output.error('Failed to send signal', error);
        handleError(error, opts.verbose);
      }
    });

  signals
    .command('list')
    .description('List all signals')
    .option('-t, --type <type>', 'Filter by type')
    .option('-s, --source <source>', 'Filter by source')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Fetching signals...').start();
        const response = await client.get<Signal[]>('/api/signals', {
          params: { type: opts.type, source: opts.source, limit: opts.limit }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch signals');
        }

        output.print(response.data.map(signal => ({
          ID: signal.id,
          Type: signal.type,
          Source: signal.source,
          Timestamp: signal.timestamp,
          Processed: signal.processed,
          Created: signal.created_at
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to list signals', error);
        handleError(error, opts.verbose);
      }
    });

  signals
    .command('insights <signal-id>')
    .description('Get insights for a signal')
    .action(async (signalId: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(signalId, 'signal ID');

        const spinner = ora('Fetching signal insights...').start();
        const response = await client.get<SignalInsight[]>(`/api/signals/${signalId}/insights`);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch insights');
        }

        output.print(response.data.map(insight => ({
          ID: insight.id,
          Type: insight.insight_type,
          Content: insight.content,
          Confidence: `${(insight.confidence * 100).toFixed(1)}%`,
          Created: insight.created_at
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to get insights', error);
        handleError(error, opts.verbose);
      }
    });

  signals
    .command('kg')
    .description('Query knowledge graph')
    .option('-q, --query <query>', 'Graph query')
    .option('-n, --node <node-id>', 'Get specific node')
    .option('-d, --depth <depth>', 'Traversal depth', '2')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Querying knowledge graph...').start();
        const response = await client.get<KnowledgeGraph>('/api/signals/knowledge-graph', {
          params: {
            query: opts.query,
            node: opts.node,
            depth: opts.depth
          }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to query knowledge graph');
        }

        const graph = response.data;
        output.header('Knowledge Graph');
        output.keyValue('Nodes', graph.nodes.length);
        output.keyValue('Edges', graph.edges.length);

        if (opts.json || opts.yaml) {
          output.print(graph);
        } else {
          output.divider();
          output.header('Nodes');
          output.print(graph.nodes.map(node => ({
            ID: node.id,
            Type: node.type,
            Label: node.label
          })));

          output.divider();
          output.header('Relationships');
          output.print(graph.edges.map(edge => ({
            Source: edge.source,
            Relationship: edge.relationship,
            Target: edge.target
          })));
        }

        process.exit(0);
      } catch (error) {
        output.error('Failed to query knowledge graph', error);
        handleError(error, opts.verbose);
      }
    });

  return signals;
}
