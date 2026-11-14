import { PageHeader } from '../../shared/ui';
import { ProjectSection } from './ProjectSection';

export function MasterDataPage() {
  return (
    <>
      <PageHeader
        title="Stammdaten"
        subtitle="Projekte und Teams, auf die sich Planung, Aufgaben und Risiken beziehen."
      />
      <ProjectSection />
    </>
  );
}
