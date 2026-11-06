'use client';

import { useEffect, useRef, useState } from 'react';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import { formatValue, parseCustomArgs } from '../lib/code-format';
import {
  codeDraftSchema,
  type CodeLanguageKey,
  runResultSchema,
  type RunResult,
  type StudentCodeAssignment,
  submissionSchema,
} from '../schemas/code-contracts';

export type SaveState =
  { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; text: string };

/** Which test case the bottom panel shows: a sample (0-based) or the custom input. */
export type CaseSelection = number | 'custom';

/**
 * Editor state for one language: debounced draft autosave (version-checked), "run" against the
 * samples or a custom input, and submit. Remount (key by language) to switch languages.
 */
export function useCodeWorkspace(props: {
  base: string;
  assignment: StudentCodeAssignment;
  language: CodeLanguageKey;
  onSubmitted: (submissionId: string) => void;
  onSubmitError: (message: string) => void;
}) {
  const a = props.assignment;
  const draftPath = `${props.base}/code-drafts/${props.language}`;
  const draft = useCodeQuery('STUDENT', draftPath, codeDraftSchema);
  const [source, setSource] = useState<string | null>(null);
  const version = useRef<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [testCase, setTestCase] = useState<CaseSelection>(0);
  const [custom, setCustom] = useState<string[]>(() =>
    a.problem.signature.params.map((_, i) =>
      a.samples[0] ? formatValue(a.samples[0].inputArgs[i]) : '',
    ),
  );
  const [run, setRun] = useState<RunResult | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const save = useCodeCommand(codeDraftSchema);
  const runner = useCodeCommand(runResultSchema);
  const submit = useCodeCommand(submissionSchema);
  const code = source ?? draft.data?.sourceCode ?? '';
  const starter = a.languages.find((l) => l.key === props.language)?.starterCode ?? '';

  // Debounced autosave; conflicts ask for a reload instead of overwriting another tab's work.
  useEffect(() => {
    const expectedVersion = version.current ?? draft.data?.version;
    if (source === null || expectedVersion === undefined) return;
    const timer = setTimeout(async () => {
      try {
        setSaveState({ kind: 'saving' });
        const saved = await save.mutateAsync({
          path: draftPath,
          method: 'PUT',
          body: { sourceCode: source, expectedVersion },
        });
        version.current = saved.version;
        setSaveState({ kind: 'saved' });
      } catch (error) {
        setSaveState({ kind: 'error', text: codeError(error, 'Chưa lưu được nháp') });
      }
    }, 1500);
    return () => clearTimeout(timer);
    // `save` is stable per component; re-run only when the code changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, draftPath]);

  async function doRun() {
    if (runner.isPending || !code.trim()) return;
    setRunError(null);
    let customArgs: unknown[] | undefined;
    if (testCase === 'custom') {
      const parsed = parseCustomArgs(a.problem.signature, custom);
      if ('error' in parsed) {
        setRun(null);
        setRunError(parsed.error);
        return;
      }
      customArgs = parsed.args;
    }
    try {
      setRun(
        await runner.mutateAsync({
          path: `${props.base}/code-runs`,
          body: {
            languageKey: props.language,
            sourceCode: code,
            ...(customArgs ? { customArgs } : {}),
          },
          timeoutMs: 95_000,
        }),
      );
      setRunCount((n) => n + 1);
    } catch (error) {
      setRun(null);
      setRunError(codeError(error, 'Chưa chạy được code.'));
    }
  }

  async function doSubmit() {
    try {
      const created = await submit.mutateAsync({
        path: `${props.base}/code-submissions`,
        body: { languageKey: props.language, sourceCode: code },
        idempotent: true,
      });
      props.onSubmitted(created.id);
    } catch (error) {
      props.onSubmitError(codeError(error, 'Chưa nộp được bài.'));
    }
  }

  return {
    draftLoading: draft.isPending,
    code,
    setCode: setSource,
    resetToStarter: () => setSource(starter),
    canReset: code !== starter,
    saveState,
    testCase,
    setTestCase,
    custom,
    setCustom,
    run,
    runCount,
    runError,
    running: runner.isPending,
    doRun,
    submitting: submit.isPending,
    doSubmit,
  };
}

export type CodeWorkspace = ReturnType<typeof useCodeWorkspace>;
