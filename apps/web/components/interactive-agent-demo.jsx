'use client'

import { useEffect, useId, useState } from 'react'

const views = ['Вопрос', 'План', 'Ревью']

export function InteractiveAgentDemo() {
  const panelId = useId()
  const [activeView, setActiveView] = useState('Ревью')
  const [checkStage, setCheckStage] = useState(3)
  const [runVersion, setRunVersion] = useState(0)
  const [acceptedFiles, setAcceptedFiles] = useState([])

  useEffect(() => {
    if (runVersion === 0) return

    const timers = [
      window.setTimeout(() => setCheckStage(1), 420),
      window.setTimeout(() => setCheckStage(2), 980),
      window.setTimeout(() => setCheckStage(3), 1620),
    ]

    return () => timers.forEach(window.clearTimeout)
  }, [runVersion])

  function runCheck() {
    setActiveView('Ревью')
    setCheckStage(0)
    setRunVersion((version) => version + 1)
  }

  function handleTabKey(event) {
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')]
    const current = tabs.indexOf(event.target)
    if (current < 0) return
    const next = {
      ArrowLeft: (current + tabs.length - 1) % tabs.length,
      ArrowRight: (current + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    setActiveView(views[next])
    tabs[next].focus()
  }

  function toggleFile(file) {
    setAcceptedFiles((files) =>
      files.includes(file) ? files.filter((item) => item !== file) : [...files, file],
    )
  }

  return (
    <div className="interactive-demo">
      <div
        className="ide-window patch-ide"
        aria-label="Интерактивный пример ревью AI-патча в TripleCode"
      >
        <div className="demo-command-bar">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff6258]" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="size-2.5 rounded-full bg-[#28c941]" />
          </div>
          <span className="demo-project-name">relay-api / TypeScript</span>
          <div className="demo-task-switcher" aria-label="Этапы работы с агентом">
            <span>FLOW</span>
            <div role="tablist" aria-label="Вопрос, план и ревью" onKeyDown={handleTabKey}>
              {views.map((view, index) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={panelId + "-tab-" + index}
                  aria-controls={panelId}
                  tabIndex={activeView === view ? 0 : -1}
                  aria-selected={activeView === view}
                  className={activeView === view ? 'is-active' : undefined}
                  onClick={() => setActiveView(view)}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="demo-run-button" onClick={runCheck}>
            <span className={checkStage < 3 ? 'demo-run-dot is-running' : 'demo-run-dot'} />
            {checkStage < 3 ? 'Проверяем патч' : 'Check patch'}
          </button>
        </div>

        <div className="ide-grid">
          <aside className="ide-files" aria-label="Файлы проекта">
            <p className="ide-label">EXPLORER</p>
            <div className="mt-4 space-y-2.5 font-mono text-[10px] text-[#777b85]">
              <p className="text-[#d8dae0]">⌄ relay-api</p>
              <p className="text-[#8f939c]">⌄ src / api</p>
              <p className="file-active">
                <span className="text-[#62a9ff]">TS</span> router.ts
              </p>
              <p>
                <span className="text-[#62a9ff]">TS</span> handlers.ts
              </p>
              <p className="text-[#8f939c]">⌄ tests</p>
              <p>
                <span className="text-[#62a9ff]">TS</span> request-id.test.ts
              </p>
            </div>
            <div className="ide-change-count">
              <span>2 файла</span>
              <b>+32 −3</b>
            </div>
          </aside>

          <div className="ide-editor">
            <div className="ide-tabs">
              <span>router.ts</span>
              <span>request-id.test.ts</span>
              <small>PROPOSED PATCH</small>
            </div>

            <div className="demo-view" role="tabpanel" id={panelId} aria-labelledby={panelId + "-tab-" + views.indexOf(activeView)} tabIndex={0}>
            {activeView === 'Вопрос' ? (
              <div className="demo-conversation">
                <span>ВОПРОС К ПРОЕКТУ</span>
                <p>Добавь идентификатор запроса в каждый ответ API.</p>
                <div>
                  <b>Контекст передан</b>
                  <small>router.ts · handlers.ts · tests/</small>
                </div>
              </div>
            ) : activeView === 'План' ? (
              <div className="demo-plan-view">
                <span>ПЛАН / ОЖИДАЕТ СОГЛАСОВАНИЯ</span>
                <ol>
                  <li>
                    <b>01</b>
                    <p>Создать request ID в начале обработки запроса.</p>
                  </li>
                  <li>
                    <b>02</b>
                    <p>Добавить заголовок x-request-id во все ветки ответа.</p>
                  </li>
                  <li>
                    <b>03</b>
                    <p>Покрыть успешный ответ и ошибку 500 тестами.</p>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="code-block patch-code" aria-label="Предложенные изменения кода">
                <p>
                  <i>21</i>
                  <span className="code-purple">export async function</span>{' '}
                  <span className="code-blue">handleRequest</span>(req) {'{'}
                </p>
                <p className="diff-add is-visible">
                  <i>22</i> <span className="code-purple">const</span> requestId =
                  crypto.randomUUID()
                </p>
                <p>
                  <i>23</i>
                  <span className="code-purple">try</span> {'{'}
                </p>
                <p className="diff-add is-visible">
                  <i>24</i> <span className="code-purple">return</span> reply(data, {'{'} requestId{' '}
                  {'}'})
                </p>
                <p className="diff-add is-visible">
                  <i>25</i> <span className="code-purple">catch</span> (error) {'{'}
                </p>
                <p className="diff-add is-visible">
                  <i>26</i> <span className="code-purple">return</span> fail(error)
                </p>
                <p>
                  <i>27</i>
                  {'}'}
                </p>
              </div>
            )}
            </div>

            <div className="ide-terminal patch-terminal">
              <div>
                <p className="ide-label">CHECK PATCH</p>
                <span>{checkStage < 3 ? 'RUNNING' : 'COMPLETE'}</span>
              </div>
              {checkStage < 3 ? (
                <p className="patch-running" aria-live="polite">
                  $ triplecode check --target proposed <span className="terminal-caret">▋</span>
                </p>
              ) : (
                <div className="patch-results" aria-live="polite">
                  <p>
                    <span>CURRENT · main</span>
                    <b>18 passed</b>
                  </p>
                  <p className="has-failure">
                    <span>PROPOSED · patch/TC-042</span>
                    <b>17 passed · 1 failed</b>
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="ide-agent patch-review-panel">
            <div className="patch-agent-head">
              <div>
                <span>AI-АГЕНТ</span>
                <b>{activeView}</b>
              </div>
              <i className={checkStage < 3 ? 'is-running' : ''} />
            </div>
            <div className="patch-agent-body">
              <div className="patch-task">
                <span>ЗАДАЧА</span>
                <p>Добавь идентификатор запроса в ответы API.</p>
              </div>
              <div className="patch-status-list">
                <p className="is-done">
                  <span>01</span> Контекст изучен
                </p>
                <p className="is-done">
                  <span>02</span> План согласован
                </p>
                <p className={checkStage === 3 ? 'has-warning' : 'is-running'}>
                  <span>03</span> {checkStage === 3 ? 'Проверка: 1 ошибка' : 'Патч проверяется'}
                </p>
              </div>
              <div className="patch-file-review">
                <span>ПРИНЯТЬ ПО ФАЙЛАМ</span>
                {['router.ts', 'request-id.test.ts'].map((file) => {
                  const accepted = acceptedFiles.includes(file)
                  return (
                    <button
                      key={file}
                      type="button"
                      aria-pressed={accepted}
                      className={accepted ? 'is-accepted' : undefined}
                      onClick={() => toggleFile(file)}
                    >
                      <span>{file}</span>
                      <b>{accepted ? 'Принято' : 'Принять'}</b>
                    </button>
                  )
                })}
              </div>
              <p className="patch-safety-note">До вашего решения рабочий проект не изменяется.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
