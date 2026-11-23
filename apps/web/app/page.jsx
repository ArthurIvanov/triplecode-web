import { Button } from '@/components/ui/button';
import { Workflow } from '@/components/workflow';

const files = ['router.ts', 'request-id.ts', 'server.ts'];
const code = [
  <><b>import</b> {'{ route }'} <b>from</b> <em>'./routes'</em>;</>,
  <><b>import</b> {'{ requestId }'} <b>from</b> <em>'./request-id'</em>;</>,
  ' ',
  <><b>export async function</b> handle(request) {'{'}</>,
  <>  <b>const</b> response = <b>await</b> route(request);</>,
  <>  response.headers.set(<em>'x-request-id'</em>, requestId());</>,
  <>  <b>return</b> response;</>,
  '}',
];

function Workbench() {
  return (
    <figure className="product shell">
      <div className="window">
        <div className="window-top">
          <span className="traffic" aria-hidden="true"><i /><i /><i /></span>
          <span>relay-api — TripleCode</span>
          <span className="preview-label">Пример работы</span>
        </div>
        <div className="workspace">
          <aside className="tree" aria-label="Файлы проекта">
            <strong>EXPLORER</strong><p>⌄ relay-api</p><p>⌄ src</p>
            {files.map((file, index) => <p className={index === 0 ? 'selected' : undefined} key={file}><span>TS</span> {file}</p>)}
          </aside>
          <div className="editor">
            <div className="tab">TS&nbsp; router.ts</div>
            <pre><code>{code.map((line, index) => (
              <span className={index === 5 ? 'added' : undefined} key={index}>
                <span className="line-number" aria-hidden="true">{index + 1}</span>{line}{'\n'}
              </span>
            ))}</code></pre>
            <div className="terminal"><strong>TERMINAL</strong><p>❯ npm test</p><p>✓ router.test.ts</p></div>
          </div>
          <div className="agent">
            <div className="tab">Agent</div>
            <div className="agent-body">
              <p className="prompt">Добавь request ID в ответы API.</p>
              <p>Добавил заголовок и обновил тест маршрута.</p>
              <div className="diff"><span>router.ts</span><code>+ response.headers.set(…)</code></div>
              <p className="review">2 файла · Готово к ревью</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">Агент добавляет заголовок request ID, запускает команду проверки и показывает изменения.</figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero shell">
        <h1>От задачи до ревью.<br />В одном редакторе.</h1>
        <p>TripleCode объединяет редактор, терминал и AI-агента. Разберите задачу, согласуйте план и проверьте правки в своём проекте.</p>
        <div className="hero-actions">
          <Button asChild><a href="/login">Создать аккаунт</a></Button>
          <Button asChild variant="outline"><a href="#workflow">Как работает агент</a></Button>
        </div>
      </section>
      <Workbench />
      <Workflow />
    </>
  );
}
