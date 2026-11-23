import { Button } from '@/components/ui/button'
import { ArrowIcon } from '@/components/brand'
import { KineticProductScene } from '@/components/kinetic-product-scene'
import { SiteHeader } from '@/components/site-header'

const reviewSignals = [
  'router.ts +18 −3',
  'request-id.test.ts +14',
  'CURRENT 18/18',
  'PATCH 17/18',
  '2 файла на ревью',
]

const flow = [
  [
    '01',
    'Откройте проект',
    'TripleCode работает с существующим TypeScript-проектом и его контекстом.',
  ],
  ['02', 'Согласуйте план', 'Перед первой правкой агент показывает, какие файлы изменит и почему.'],
  [
    '03',
    'Проверьте патч',
    'Запустите тесты на временной версии проекта с предложенными изменениями.',
  ],
  [
    '04',
    'Примите по файлам',
    'Оставьте только готовые правки. Остальное можно отклонить или доработать.',
  ],
]

export default function HomePage() {
  return (
    <div className="site-page command-page min-h-screen overflow-x-hidden">
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="command-hero">
          <div className="command-grid" aria-hidden="true" />
          <div className="command-shell mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="command-status" aria-label="Статус TripleCode">
              <span>TRIPLECODE / DESKTOP IDE</span>
              <span>macOS DEMO · TYPESCRIPT / NODE.JS</span>
              <span className="command-status-live">
                <i /> PATCH REVIEW READY
              </span>
            </div>

            <div className="command-hero-layout">
              <div className="command-copy">
                <p className="command-kicker">AI пишет. Вы решаете, что останется в проекте.</p>
                <h1>
                  Проверьте правки AI
                  <br />
                  до того, как
                  <br />
                  <em>принять их.</em>
                </h1>
                <p className="command-lede">
                  TripleCode — настольная IDE со встроенным AI-агентом. Откройте свой проект,
                  согласуйте план, посмотрите diff и запустите тесты на предложенных изменениях.
                  Примите те правки, которые готовы оставить в коде.
                </p>
                <div className="command-actions">
                  <Button asChild variant="brand"><a href="/login">Создать аккаунт <ArrowIcon /></a></Button>
                  <a href="#how" className="command-text-link">
                    Посмотреть, как работает агент <span>↓</span>
                  </a>
                </div>
                <div className="command-facts" aria-label="Основные возможности">
                  <span>01 / План до правок</span>
                  <span>02 / Многофайловый diff</span>
                  <span>03 / Check patch</span>
                  <span>04 / Приём по файлам</span>
                </div>
              </div>

              <aside className="mission-ticket patch-ticket" aria-label="Результат проверки патча">
                <div className="mission-ticket-head">
                  <span>PATCH / TC-042</span>
                  <span className="mission-active">REVIEW</span>
                </div>
                <div className="mission-ticket-body">
                  <p>ЗАДАЧА АГЕНТУ</p>
                  <h2>Добавь идентификатор запроса в ответы API.</h2>
                  <div className="patch-ticket-files">
                    <span>router.ts</span>
                    <b>+18 −3</b>
                    <span>request-id.test.ts</span>
                    <b>+14</b>
                  </div>
                  <div className="patch-check-compare">
                    <div>
                      <span>CURRENT</span>
                      <strong>18 / 18</strong>
                      <small>текущий код</small>
                    </div>
                    <div className="has-failure">
                      <span>PROPOSED PATCH</span>
                      <strong>17 / 18</strong>
                      <small>1 тест требует внимания</small>
                    </div>
                  </div>
                </div>
                <div className="mission-ticket-track" aria-hidden="true">
                  <span className="is-done">01 Вопрос</span>
                  <span className="is-done">02 План</span>
                  <span className="is-live">03 Проверка</span>
                  <span>04 Решение</span>
                </div>
                <div className="mission-ticket-foot">
                  <span>ПАТЧ НЕ ПРИМЕНЁН</span>
                  <span>РЕШЕНИЕ ЗА ВАМИ</span>
                </div>
              </aside>
            </div>

            <KineticProductScene />
          </div>
        </section>

        <section className="signal-tape" aria-label="Что видно во время ревью">
          <div className="signal-row signal-row-tasks">
            {[0, 1].map((copy) => (
              <div key={copy} className="signal-sequence" aria-hidden={copy === 1}>
                {reviewSignals.map((signal) => (
                  <span key={signal}>REVIEW / {signal}</span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="review-flow">
          <header className="review-section-head mx-auto max-w-[1440px] px-5 sm:px-8">
            <div>
              <span>ОДИН СЦЕНАРИЙ / ОТ ВОПРОСА ДО РЕВЬЮ</span>
              <h2>
                Агент предлагает.
                <br />
                <em>Вы проверяете.</em>
              </h2>
            </div>
            <p>
              На каждом шаге видно, с какой версией проекта работает TripleCode и что именно попадёт
              в код после вашего решения.
            </p>
          </header>
          <div className="review-flow-grid mx-auto max-w-[1440px] px-5 sm:px-8">
            {flow.map(([index, title, description]) => (
              <article key={index}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="capability-section">
          <header className="review-section-head mx-auto max-w-[1440px] px-5 sm:px-8">
            <div>
              <span>ВСТРАИВАЕТСЯ В ТЕКУЩУЮ РАБОТУ</span>
              <h2>
                Контроль не после AI.
                <br />
                <em>Контроль — часть процесса.</em>
              </h2>
            </div>
            <p>
              Для разработчиков и небольших команд, которые уже работают в VS Code, ведут
              существующие проекты и используют AI для задач на несколько файлов.
            </p>
          </header>

          <div className="capability-grid mx-auto max-w-[1440px] px-5 sm:px-8">
            <article className="capability-card capability-card-featured">
              <div className="capability-copy">
                <span>01 / CHECK PATCH</span>
                <h3>Проверка патча до применения</h3>
                <p>
                  Запустите тесты на временной копии проекта с правками агента. Вы увидите результат
                  проверки именно того кода, который собираетесь принять.
                </p>
              </div>
              <div className="mini-check-ui" aria-label="Сравнение результатов тестов">
                <div>
                  <span>CURRENT · main</span>
                  <b>18 passed</b>
                  <i className="is-pass" />
                </div>
                <div>
                  <span>PROPOSED · patch/TC-042</span>
                  <b>17 passed · 1 failed</b>
                  <i className="is-fail" />
                </div>
                <p>request-id.test.ts · response 500 должен содержать x-request-id</p>
              </div>
            </article>

            <article className="capability-card">
              <div className="capability-copy">
                <span>02 / FILE CONTROL</span>
                <h3>Контроль над правками</h3>
                <p>
                  Согласуйте план, проверьте многофайловый diff и примите изменения только в тех
                  файлах, которые готовы оставить.
                </p>
              </div>
              <div className="mini-file-ui" aria-label="Выбор изменений по файлам">
                <div>
                  <span>
                    <i className="is-selected" /> router.ts
                  </span>
                  <b>Принять</b>
                </div>
                <div>
                  <span>
                    <i /> request-id.test.ts
                  </span>
                  <b className="is-muted">Оставить на ревью</b>
                </div>
                <small>Можно отменить последнюю AI-правку</small>
              </div>
            </article>

            <article className="capability-card">
              <div className="capability-copy">
                <span>03 / VS CODE PROFILE</span>
                <h3>Переход со своим профилем</h3>
                <p>
                  Перенесите рабочие настройки, сочетания клавиш и сниппеты. После импорта видно,
                  что перенеслось и какие расширения требуют внимания.
                </p>
              </div>
              <div className="mini-import-ui" aria-label="Отчёт импорта профиля">
                <div>
                  <span>Настройки</span>
                  <b>Импортировано · 42</b>
                </div>
                <div>
                  <span>Сочетания клавиш</span>
                  <b>Импортировано · 18</b>
                </div>
                <div>
                  <span>Расширения</span>
                  <b className="needs-review">3 требуют внимания</b>
                </div>
              </div>
            </article>

            <article className="capability-card">
              <div className="capability-copy">
                <span>04 / MODEL RUNTIME</span>
                <h3>Выбор, где работает модель</h3>
                <p>
                  Используйте локальную модель через Ollama или подключите облачную модель через
                  OpenRouter со своим ключом.
                </p>
              </div>
              <div className="mini-model-ui" aria-label="Выбор способа запуска модели">
                <div className="is-active">
                  <span>LOCAL</span>
                  <b>Ollama · Qwen Coder</b>
                  <small>Работает на этом Mac</small>
                </div>
                <div>
                  <span>CLOUD</span>
                  <b>OpenRouter</b>
                  <small>Ваш API-ключ</small>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="product-boundary">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <span>ЧЕСТНЫЕ ГРАНИЦЫ ПРОДУКТА</span>
            <p>
              Демо показывает текущую сборку для macOS. Поддержка расширений проверяется по
              конкретным сценариям. Облачные фоновые задачи, подписка и квоты не входят в публичные
              обещания текущей версии.
            </p>
          </div>
        </section>

        <section className="command-cta">
          <div className="command-cta-inner mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="command-cta-code" aria-hidden="true">
              ASK / PLAN / DIFF / CHECK / ACCEPT
            </div>
            <p>TRIPLECODE / PATCH REVIEW</p>
            <h2>
              Сначала проверьте.
              <br />
              Потом <em>принимайте.</em>
            </h2>
            <div>
              <Button asChild variant="brand"><a href="/login">Создать аккаунт <ArrowIcon /></a></Button>
              <span>Вход по email · без карты</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer px-5 py-7 text-xs sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 TripleCode</span>
          <span>Desktop IDE / Review AI changes before they reach your project</span>
        </div>
      </footer>
    </div>
  )
}
