import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const steps = [
  {
    id: 'ask', label: 'Вопрос', title: 'Разберитесь в проекте',
    copy: 'Передайте агенту файл или выделенный фрагмент, чтобы понять, где внести изменение.',
    prompt: 'Где добавить идентификатор запроса?',
    response: 'В router.ts формируется общая точка ответа. Там можно один раз установить заголовок x-request-id для маршрутов API.',
  },
  {
    id: 'plan', label: 'План', title: 'Согласуйте план',
    copy: 'Обсудите изменения до начала работы и выберите, какие проверки запустить.',
    prompt: 'Составь план и добавь проверку.',
    response: 'Подключить requestId() в router.ts, проверить заголовок в router.test.ts и запустить тест маршрута.',
  },
  {
    id: 'review', label: 'Ревью', title: 'Проверьте правки',
    copy: 'Откройте diff и выберите, какие изменения оставить в рабочем дереве.',
    prompt: 'Покажи итоговые изменения.',
    response: 'Изменены router.ts и router.test.ts. Проверка маршрута прошла. Правки готовы к ревью.',
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="shell workflow">
      <h2>Как агент работает с кодом</h2>
      <Tabs defaultValue="ask">
        <TabsList aria-label="Этапы работы агента" className="mt-6">
          {steps.map(step => <TabsTrigger value={step.id} key={step.id}>{step.label}</TabsTrigger>)}
        </TabsList>
        {steps.map(step => (
          <TabsContent value={step.id} key={step.id}>
            <Card className="workflow-panel">
              <div className="workflow-copy"><h3>{step.title}</h3><p>{step.copy}</p></div>
              <div className="workflow-dialog">
                <p className="workflow-prompt">{step.prompt}</p>
                <p className="workflow-response">{step.response}</p>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
