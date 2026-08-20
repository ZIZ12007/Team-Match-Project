import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Clock,
  Loader2,
  Code2,
  Sliders,
  RotateCcw,
  AlertCircle,
  Database,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';

export function CypherPlayground() {
  const [showcaseQueries, setShowcaseQueries] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState('multi-hop-skill');
  const [customCypher, setCustomCypher] = useState('');
  const [customParamsJson, setCustomParamsJson] = useState('{}');
  const [showParamsEditor, setShowParamsEditor] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load Showcase metadata
  useEffect(() => {
    api
      .getCypherShowcase()
      .then((res) => {
        const queries = res.queries || [];
        setShowcaseQueries(queries);
        const first = queries[0];
        if (first) {
          setSelectedQueryId(first.id);
          setCustomCypher(first.cypher);
          setCustomParamsJson(JSON.stringify(first.defaultParams || {}, null, 2));
        }
      })
      .catch((err) => console.error('Failed to load showcase queries:', err));
  }, []);

  const activeItem = showcaseQueries.find((q) => q.id === selectedQueryId);

  const handleSelectQuery = (item) => {
    setSelectedQueryId(item.id);
    setCustomCypher(item.cypher);
    setCustomParamsJson(JSON.stringify(item.defaultParams || {}, null, 2));
    setExecutionResult(null);
    setError(null);
  };

  const handleResetToTemplate = () => {
    if (activeItem) {
      setCustomCypher(activeItem.cypher);
      setCustomParamsJson(JSON.stringify(activeItem.defaultParams || {}, null, 2));
      setError(null);
    }
  };

  const runQuery = async () => {
    if (!customCypher.trim()) return;
    setRunning(true);
    setError(null);

    let parsedParams = {};
    try {
      if (customParamsJson.trim()) {
        parsedParams = JSON.parse(customParamsJson);
      }
    } catch (parseErr) {
      setError(`Invalid JSON in Query Parameters: ${parseErr.message}`);
      setRunning(false);
      return;
    }

    try {
      const res = await api.runCypherQuery({
        customCypher,
        params: parsedParams,
      });
      setExecutionResult(res);
    } catch (err) {
      setError(err.message || 'Cypher query execution error.');
    } finally {
      setRunning(false);
    }
  };

  const copyCypher = () => {
    navigator.clipboard.writeText(customCypher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recordCount =
    executionResult?.recordCount ??
    executionResult?.count ??
    executionResult?.records?.length ??
    0;

  const executionTime =
    executionResult?.executionMs ??
    executionResult?.durationMs ??
    0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card p-6 bg-[#08123B] text-white border-2 border-[#08123B] shadow-[6px_6px_0px_#FF007A]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md border border-white bg-[#FF007A] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase">
                QUERY LABORATORY // CYPHER VS SQL BENCHMARK
              </span>
              <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
                INTERACTIVE REPL
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Graph Query Execution Engine
            </h2>
            <p className="text-xs sm:text-sm font-mono-code text-white/80 mt-1 max-w-2xl leading-relaxed">
              Execute live declarative Cypher graph pattern queries against CognoDB and inspect real execution timings versus relational SQL recursive CTEs.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97, y: 1 }}
            onClick={runQuery}
            disabled={running}
            className="brutal-btn bg-[#0052FF] text-white px-6 py-3 font-display text-sm font-extrabold uppercase shadow-[3px_3px_0px_#FFFFFF] hover:bg-[#0042D9] self-start sm:self-center shrink-0 flex items-center gap-2"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
            <span>{running ? 'EXECUTING...' : 'RUN CYPHER'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Preset Query Tabs */}
      <div className="flex flex-wrap gap-2">
        {showcaseQueries.map((q) => {
          const isSelected = selectedQueryId === q.id;
          return (
            <motion.button
              key={q.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSelectQuery(q)}
              className={`px-3.5 py-2 text-xs font-display font-extrabold uppercase rounded-lg border-2 border-[#08123B] transition-all ${
                isSelected
                  ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#0052FF]'
                  : 'bg-white text-[#08123B] hover:bg-[#F4F6FB]'
              }`}
            >
              {q.title}
            </motion.button>
          );
        })}
      </div>

      {/* Query Editor & SQL Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Cypher Code Editor */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-7 brutal-card p-5 bg-white space-y-4 shadow-[4px_4px_0px_#08123B]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#08123B]/15">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#0052FF]" />
              <span className="font-mono-code text-xs font-bold uppercase text-[#08123B]">
                DECLARATIVE CYPHER PATTERN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowParamsEditor((prev) => !prev)}
                className={`rounded border border-[#08123B] px-2 py-1 text-xs font-mono-code flex items-center gap-1 transition-colors ${
                  showParamsEditor ? 'bg-[#0052FF] text-white' : 'bg-[#F4F6FB] text-[#08123B] hover:bg-[#E2E8F0]'
                }`}
                title="Toggle Query Parameters Editor"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>PARAMS ($)</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetToTemplate}
                className="rounded border border-[#08123B] bg-[#F4F6FB] px-2 py-1 text-xs font-mono-code flex items-center gap-1 hover:bg-[#E2E8F0]"
                title="Reset Cypher query and parameters to default template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>RESET</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyCypher}
                className="rounded border border-[#08123B] bg-[#F4F6FB] px-2 py-1 text-xs font-mono-code flex items-center gap-1 hover:bg-[#08123B] hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#00D26A]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </motion.button>
            </div>
          </div>

          <textarea
            value={customCypher}
            onChange={(e) => setCustomCypher(e.target.value)}
            rows={9}
            className="w-full rounded-xl border-2 border-[#08123B] bg-[#08123B] p-4 font-mono-code text-xs font-bold text-[#00D26A] focus:outline-none shadow-[3px_3px_0px_#08123B] selection:bg-[#FF007A]"
            placeholder="Type Cypher query (e.g. MATCH (p:Person)-[:KNOWS]->(c:Person) RETURN p, c LIMIT 10)..."
          />

          {/* Expandable Parameters Editor */}
          <AnimatePresence>
            {showParamsEditor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl border-2 border-dashed border-[#08123B] bg-[#F4F6FB] space-y-1.5 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs font-mono-code font-bold text-[#08123B]">
                  <span>QUERY PARAMETERS (JSON):</span>
                  <span className="text-[10px] text-[#7382A6]">Referenced as $variable in Cypher</span>
                </div>
                <textarea
                  value={customParamsJson}
                  onChange={(e) => setCustomParamsJson(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#08123B] bg-[#08123B] p-2.5 font-mono-code text-xs font-bold text-[#FFCC00] focus:outline-none"
                  placeholder='{ "personId": "p1", "skillName": "PyTorch" }'
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between text-xs font-mono-code text-[#4A5578]">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#0052FF]" />
              <span>ENGINE: COGNODB BOLT PROTOCOL</span>
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={runQuery}
              disabled={running}
              className="brutal-btn bg-[#0052FF] text-white px-4 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center gap-1.5"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
              <span>EXECUTE QUERY</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Right 5 Columns: SQL Equivalence / Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-5 brutal-card p-5 bg-[#F4F6FB] space-y-3 shadow-[4px_4px_0px_#08123B]"
        >
          <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-[#FF007A]" />
            SQL RECURSIVE CTE EQUIVALENCE
          </h3>

          <p className="text-xs text-[#4A5578] font-mono-code leading-relaxed">
            {activeItem?.whyGraphWins ||
              'Relational databases require multi-level self-joins and memory-intensive recursive CTEs to emulate variable-length graph traversals.'}
          </p>

          <div className="rounded-xl border-2 border-[#08123B] bg-[#08123B] p-3 font-mono-code text-[11px] text-white/90 overflow-x-auto max-h-56">
            <pre className="text-[#FF007A] whitespace-pre-wrap">{activeItem?.sqlEquivalent || '-- SQL Recursive Join Equivalence\nWITH RECURSIVE network_path AS (...) \nSELECT * FROM network_path;'}</pre>
          </div>

          <div className="rounded-lg border border-[#08123B] bg-white p-3 font-mono-code text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[#08123B] font-bold">
              <span>SQL COMPLEXITY:</span>
              <span className="text-[#FF007A]">O(N^d) Join Thrashing</span>
            </div>
            <div className="flex items-center justify-between text-[#08123B] font-bold">
              <span>CYPHER GRAPH TRAVERSAL:</span>
              <span className="text-[#00D26A]">O(d) Direct Pointers</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ERROR OUTPUT */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border-2 border-[#08123B] bg-[#FF007A] text-white p-4 font-mono-code text-xs shadow-[3px_3px_0px_#08123B] flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase mb-0.5">[QUERY ERROR]</p>
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXECUTION RESULTS TABLE */}
      <AnimatePresence>
        {executionResult && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="brutal-card p-5 bg-white space-y-4 shadow-[4px_4px_0px_#08123B]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#08123B]/15">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[#08123B] bg-[#00D26A] text-[#08123B] px-2 py-0.5 font-mono-code text-xs font-bold uppercase">
                  QUERY COMPLETED
                </span>
                <span className="font-mono-code text-xs text-[#4A5578]">
                  {recordCount} {recordCount === 1 ? 'RECORD' : 'RECORDS'} RETURNED
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono-code text-xs text-[#08123B]">
                <Clock className="h-3.5 w-3.5 text-[#0052FF]" />
                <span>LATENCY: <strong>{executionTime}ms</strong></span>
              </div>
            </div>

            {/* Records Table or Empty State */}
            {recordCount === 0 ? (
              <div className="p-8 text-center font-mono-code border-2 border-dashed border-[#08123B]/30 rounded-xl bg-[#F4F6FB]">
                <p className="font-bold text-xs uppercase text-[#08123B] mb-1">0 RECORDS RETURNED</p>
                <p className="text-xs text-[#7382A6]">No graph nodes or edges matched the specified Cypher pattern and filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 border-2 border-[#08123B] rounded-xl">
                <table className="w-full font-mono-code text-xs text-left border-collapse">
                  <thead className="bg-[#08123B] text-white uppercase text-[11px] font-bold sticky top-0">
                    <tr>
                      {Object.keys(executionResult.records?.[0] || {}).map((col, idx) => (
                        <th key={idx} className="p-3 border-r border-white/20 last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#08123B]/20">
                    {(executionResult.records || []).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#F4F6FB] transition-colors">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="p-3 border-r border-[#08123B]/10 last:border-r-0 text-[#08123B]">
                            {typeof val === 'object' && val !== null ? (
                              <pre className="text-[10px] bg-[#F4F6FB] p-1.5 rounded border border-[#08123B]/20 max-w-xs overflow-x-auto">
                                {JSON.stringify(val, null, 1)}
                              </pre>
                            ) : (
                              String(val ?? '')
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
