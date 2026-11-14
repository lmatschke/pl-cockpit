import { PageHeader } from '../../shared/ui';
import { ProjectSection } from './ProjectSection';
import { TeamSection } from './TeamSection';

export function MasterDataPage() {
  return (
    <>
      <PageHeader
        title="Stammdaten"
        subtitle="Projekte und Teams, auf die sich Planung, Aufgaben und Risiken beziehen."
      />
      <ProjectSection />
      <TeamSection />
    </>
  );
}
