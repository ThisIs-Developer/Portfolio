import order from "../data/project-order.json" with { type: "json" };

export function projectCollections({
  projects = [],
  experiments = [],
  projectAdditions = [],
}) {
  const entries = [...projects, ...experiments, ...projectAdditions];
  const byId = new Map(entries.map((project) => [project.id, project]));
  const ids = [...order.featured, ...order.archive];
  if (new Set(ids).size !== ids.length)
    throw new Error("Project selection contains duplicate IDs.");
  const select = (ids) =>
    ids.map((id) => {
      const project = byId.get(id);
      if (!project) throw new Error(`Selected project ${id} is missing.`);
      return {
        ...project,
        number: String(
          [...order.featured, ...order.archive].indexOf(id) + 1,
        ).padStart(2, "0"),
      };
    });
  return {
    featured: select(order.featured),
    archive: select(order.archive),
    all: select(ids),
  };
}
