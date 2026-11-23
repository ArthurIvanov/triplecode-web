export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const brand = '<a class="brand" href="/"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>TripleCode</a>';

function page(title, content, { home = false } = {}) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · TripleCode</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip" href="#main">К содержимому</a>
  <header class="header"><div class="shell top">${brand}
    ${home ? '<nav aria-label="Основная навигация"><a href="#workflow">Как работает</a><a class="nav-login" href="/login">Войти</a></nav>' : ''}
  </div></header>
  <main id="main">${content}</main>
  <footer class="shell footer">${brand}<span>Среда разработки с AI-агентом</span></footer>
</body>
</html>`;
}

export function homePage() {
  return page('Среда разработки с AI-агентом', `
<section class="shell hero">
  <p class="eyebrow"><span></span> Рабочая среда для разработчиков</p>
  <h1>От задачи<br>до ревью кода.</h1>
  <p class="intro">TripleCode объединяет редактор, терминал и AI-агента. Разберите задачу, пройдитесь по плану и проверьте изменения в своём проекте.</p>
  <div class="actions">
    <a class="button primary" href="/login">Создать аккаунт</a>
    <a class="button secondary" href="#workflow">Как работает агент</a>
  </div>
</section>
<figure class="shell product" aria-label="Пример работы агента в TripleCode">
  <div class="window">
    <div class="window-top"><span class="traffic" aria-hidden="true"><i></i><i></i><i></i></span><span>relay-api — TripleCode</span><span>Предпросмотр</span></div>
    <div class="workspace">
      <div class="tree"><strong>EXPLORER</strong><p>⌄ relay-api</p><p>⌄ src</p><p class="selected">TS router.ts</p><p>TS request-id.ts</p><p>TS server.ts</p></div>
      <div class="editor">
        <div class="tab">TS&nbsp; router.ts</div>
        <pre><code><span>1</span> <b>import</b> { route } <b>from</b> <em>'./routes'</em>;
<span>2</span> <b>import</b> { requestId } <b>from</b> <em>'./request-id'</em>;
<span>3</span>
<span>4</span> <b>export async function</b> handle(request) {
<span>5</span>   <b>const</b> response = <b>await</b> route(request);
<span>6</span>   response.headers.set(<em>'x-request-id'</em>, requestId());
<span>7</span>   <b>return</b> response;
<span>8</span> }</code></pre>
        <div class="terminal"><strong>TERMINAL</strong><p><span>❯</span> npm test</p><p>✓ router.test.ts</p></div>
      </div>
      <div class="agent"><div class="tab">Agent</div><div class="agent-body">
        <p class="prompt">Добавь request ID в ответы API.</p>
        <p>Добавил заголовок и обновил тест маршрута.</p>
        <div class="diff"><span>router.ts</span><code>+ response.headers.set(…)</code></div>
        <p class="review">2 файла · Готово к ревью</p>
      </div></div>
    </div>
  </div>
</figure>
<section class="shell workflow" id="workflow">
  <h2>Работайте с агентом прямо в проекте</h2>
  <div class="steps">
    <article><h3>Спросите</h3><p>Передайте агенту файл или выделенный фрагмент и разберите, как устроен код.</p></article>
    <article><h3>Составьте план</h3><p>Обсудите, что менять и какие проверки выполнить, прежде чем переходить к правкам.</p></article>
    <article><h3>Проверьте изменения</h3><p>Посмотрите diff по файлам и оставьте изменения, которые хотите применить.</p></article>
  </div>
</section>`, { home: true });
}

export function loginPage({ email = '', step = 'email', error = '', configured = true } = {}) {
  const safeEmail = escapeHtml(email);
  const code = step === 'code';
  return page(code ? 'Введите код' : 'Вход', `
<section class="auth-shell shell"><div class="auth-card" aria-labelledby="auth-title">
  <h1 id="auth-title">${code ? 'Введите код' : 'Вход в TripleCode'}</h1>
  <p>${code ? `Отправили код на <strong>${safeEmail}</strong>. Он действует 10 минут.` : 'Введите email. Код из письма создаст аккаунт или откроет существующий.'}</p>
  ${error || !configured ? `<p class="error" role="alert">${escapeHtml(error || 'Вход пока недоступен. Попробуйте позже.')}</p>` : ''}
  <form method="post" action="${code ? '/auth/verify' : '/auth/code'}">
    ${code ? `<input type="hidden" name="email" value="${safeEmail}">
    <label for="token">Код из письма</label>
    <input id="token" name="token" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required>`
    : `<label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" maxlength="254" value="${safeEmail}" required>`}
    <button class="button primary" ${configured ? '' : 'disabled'}>${code ? 'Войти' : 'Получить код'}</button>
  </form>
  ${code ? `<div class="auth-options">
    <form method="post" action="/auth/code"><input type="hidden" name="email" value="${safeEmail}"><button class="text-button">Отправить код снова</button></form>
    <a href="/login">Сменить email</a>
  </div>` : ''}
</div></section>`);
}

export function profilePage(email) {
  return page('Профиль', `<section class="auth-shell shell"><div class="auth-card">
    <h1>Профиль</h1>
    <dl><dt>Email</dt><dd>${escapeHtml(email)}</dd></dl>
    <form method="post" action="/auth/logout"><button class="button secondary">Выйти</button></form>
  </div></section>`);
}

export function statusPage(title, message, href = '/', label = 'На главную') {
  return page(title, `<section class="auth-shell shell"><div class="auth-card">
    <h1>${title}</h1><p>${message}</p><a class="button secondary" href="${href}">${label}</a>
  </div></section>`);
}
