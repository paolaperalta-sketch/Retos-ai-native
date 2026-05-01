/**
 * RBAC utility — resolves logged-in user's identity and permissions
 * from the team hierarchy + email mapping.
 * 
 * Roles from Base_de_información_1.xlsx "Acceso" column:
 *   SUPER ADMIN  → super_admin  (full access, global search)
 *   ADMIN        → global_leader (area-scoped admin)
 *   LÍDER        → team_leader  (hierarchical subtree only)
 *   CONTRIBUIDOR INDIVIDUAL → individual_contributor (self only)
 */
import { teamHierarchy, findNode, findParent, flattenTree, type TeamNode } from "@/data/teamHierarchy";
import type { AppRole } from "@/contexts/AuthContext";

// ─── Email → Role mapping (from Excel "Acceso" column) ───
const EMAIL_ROLE_MAP: Record<string, { role: AppRole; name: string; area: string }> = {
  // SUPER ADMIN (People team + Manuel)
  "manuel@bia.app": { role: "super_admin", name: "MANUEL LEONARDO RODRIGUEZ VELASCO", area: "FINANCE" },
  
  "karen.villamil@bia.app": { role: "super_admin", name: "KAREN ELIANA VILLAMIL HERNANDEZ", area: "PEOPLE" },
  "sheila.barreto@bia.app": { role: "super_admin", name: "SHEILA ROCIO BARRETO MARTÍNEZ", area: "PEOPLE" },
  "paola.peralta@bia.app": { role: "super_admin", name: "PAOLA ANDREA PERALTA VARGAS", area: "PEOPLE" },
  "marialucia.velasco@bia.app": { role: "super_admin", name: "MARÍA LUCÍA VELASCO ACOSTA", area: "PEOPLE" },
  // CEO is also super_admin
  "ruales@bia.app": { role: "super_admin", name: "Sebastián Ruales", area: "EXECUTIVE" },
  "sebastian.ruales@bia.app": { role: "super_admin", name: "Sebastián Ruales", area: "EXECUTIVE" },
  "francesca.citarella@bia.app": { role: "super_admin", name: "Francesca Citarella Polo", area: "EXECUTIVE" },

  // ADMIN (area-level admins)
  "diego@bia.app": { role: "global_leader", name: "DIEGO ALFONSO SUÁREZ MAYORGA", area: "TECNOLOGÍA" },
  "yoli@bia.app": { role: "global_leader", name: "YOLI PATRICIA MARÍN CALVACHE", area: "SALES" },
  "juancho@bia.app": { role: "global_leader", name: "JUAN DAVID QUIJANO VILLEGAS", area: "MARKETING" },
  "santiago.jimenez@bia.app": { role: "global_leader", name: "Santiago Jiménez", area: "OPERACIONES" },

  // LÍDER (team leads – hierarchical access)
  "nohora@bia.app": { role: "team_leader", name: "NOHORA CONSUELO MESA CASTAÑEDA", area: "ENERGY" },
  "byron@bia.app": { role: "team_leader", name: "BYRON DAVID ORTEGA SÁNCHEZ", area: "TECNOLOGÍA" },
  "juan.otavo@bia.app": { role: "team_leader", name: "JUAN CAMILO OTAVO ESLAVA", area: "TECNOLOGÍA" },
  "esteban.martinez@bia.app": { role: "team_leader", name: "ESTEBAN MARTINEZ PINTO", area: "SALES" },
  "natalia.buritica@bia.app": { role: "team_leader", name: "NATALIA ANDREA BURITICA VERA", area: "CX" },
  "john.aponte@bia.app": { role: "team_leader", name: "JOHN CHARLES APONTE SOLANO", area: "TECNOLOGÍA" },
  "luis.gonzalez@bia.app": { role: "team_leader", name: "LUIS FERNANDO GONZALEZ PEREZ", area: "TECNOLOGÍA" },
  "daniela.carvajal@bia.app": { role: "team_leader", name: "DANIELA ALEJANDRA CARVAJAL MAHECHA", area: "FINANCE" },
  "johana.casteblanco@bia.app": { role: "team_leader", name: "JOHANA CASTEBLANCO MATEUS", area: "MARKETING" },
  "annabell.cardona@bia.app": { role: "team_leader", name: "ANNABELL CARDONA ESPITIA", area: "FINANCE" },
  "dinovi.sanchez@bia.app": { role: "team_leader", name: "DINOVI JESUS SANCHEZ FLOREZ", area: "OPERACIONES" },
  "milton.reyes@bia.app": { role: "team_leader", name: "MILTON ESTEBAN REYES PARRA", area: "OPERACIONES" },
  "hernan.manjarres@bia.app": { role: "team_leader", name: "HERNAN DARIO MANJARRES GOMEZ", area: "OPERACIONES" },
  "simon.rivera@bia.app": { role: "team_leader", name: "SIMON RIVERA GUTIERREZ", area: "OPERACIONES" },
  "ervison.plata@bia.app": { role: "team_leader", name: "ERVISON DAVID PLATA MENDOZA", area: "OPERACIONES" },
  "laura.gomez@bia.app": { role: "team_leader", name: "LAURA JULIANA GOMEZ GALVEZ", area: "OPERACIONES" },
  "damaris.castaneda@bia.app": { role: "team_leader", name: "DAMARIS KATHERINE CASTAÑEDA BERMUDEZ", area: "CX" },
  "paola.satizabal@bia.app": { role: "team_leader", name: "PAOLA DEL ROCIO SATIZABAL", area: "FINANCE" },
  "andrea.lozano@bia.app": { role: "team_leader", name: "ANDREA CATHERINE LOZANO AMEZQUITA", area: "FINANCE" },
  "julieth.rincon@bia.app": { role: "team_leader", name: "JULIETH KATERINE RINCON MEDELLIN", area: "FINANCE" },
  "cristian.romero@bia.app": { role: "team_leader", name: "CRISTIAN DAVID ROMERO HIGUERA", area: "FINANCE" },
  "diana.suarez@bia.app": { role: "team_leader", name: "DIANA MILENA SUAREZ PEREZ", area: "FINANCE" },
  "natalia.carvajal@bia.app": { role: "team_leader", name: "NATALIA CARVAJAL CARVAJAL", area: "FINANCE" },
  "michael.vargas@bia.app": { role: "team_leader", name: "MICHAEL STEVEN VARGAS MARTÍNEZ", area: "MARKETING" },
  "santiago.ruales@bia.app": { role: "team_leader", name: "SANTIAGO RUALES DUQUE", area: "MARKETING" },
  "mariapaula.pico@bia.app": { role: "team_leader", name: "MARIA PAULA PICO LOAIZA", area: "SALES" },
  "silvia.uribe@bia.app": { role: "team_leader", name: "SILVIA MILENA URIBE GUTIERREZ", area: "SALES" },
  "william.lizcano@bia.app": { role: "team_leader", name: "WILLIAM GUILLERMO LIZCANO RAMIREZ", area: "TECNOLOGÍA" },
  "juan.bautista@bia.app": { role: "team_leader", name: "JUAN SEBASTIÁN BAUTISTA GRILLO", area: "TECNOLOGÍA" },
  "juan.toro@bia.app": { role: "team_leader", name: "JUAN CARLOS TORO BETANCUR", area: "CX" },
  "katheryn.franco@bia.app": { role: "super_admin", name: "KATHERYN FRANCO RAMIREZ", area: "CX" },
  "angela.bedoya@bia.app": { role: "team_leader", name: "ANGELA MARIA BEDOYA SALCEDO", area: "LEGAL" },
  "guillermo.cajamarca@bia.app": { role: "team_leader", name: "GUILLERMO ANDRÉS CAJAMARCA MESA", area: "ENERGY" },
  "guillermo.plaza@bia.app": { role: "team_leader", name: "GUILLERMO PLAZA ROCHE", area: "TECNOLOGÍA" },
  "leonardo.velasquez@bia.app": { role: "team_leader", name: "LEONARDO VELASQUEZ FLOREZ", area: "COMPANY" },
};

// ─── eNPS-only access list (temporary preview for VPs) ───
// Restriction lifted — all users now see modules based solely on their role.
const ENPS_ONLY_EMAILS = new Set<string>([]);

export function isEnpsOnlyUser(email: string | undefined): boolean {
  if (!email) return false;
  return ENPS_ONLY_EMAILS.has(email.toLowerCase());
}

// ─── Email → hierarchy name mapping ───
const EMAIL_TO_HIERARCHY_NAME: Record<string, string> = {};
for (const [email, info] of Object.entries(EMAIL_ROLE_MAP)) {
  EMAIL_TO_HIERARCHY_NAME[email] = info.name;
}
// Add extra aliases that may differ from hierarchy names
Object.assign(EMAIL_TO_HIERARCHY_NAME, {
  "francesca.citarella@bia.app": "Francesca Citarella Polo",
  "ernesto.torres@bia.app": "Ernesto Carlos Torres Rojas",
  "nohora.mesa@bia.app": "Nohora Consuelo Mesa Castañeda",
  "diego.suarez@bia.app": "Diego Alfonso Suárez Mayorga",
  "byron.ortega@bia.app": "Byron David Ortega Sánchez",
});

/** Resolve a login email to a hierarchy name */
export function resolveUserName(email: string | undefined): string | null {
  if (!email) return null;
  const lower = email.toLowerCase();

  if (EMAIL_TO_HIERARCHY_NAME[lower]) return EMAIL_TO_HIERARCHY_NAME[lower];

  // Fallback: fuzzy match in hierarchy
  const prefix = lower.split("@")[0];
  const allNodes = flattenTree(teamHierarchy);
  for (const node of allNodes) {
    const nameLower = node.name.toLowerCase();
    const parts = prefix.split(".");
    if (parts.every(p => nameLower.includes(p))) return node.name;
  }
  return null;
}

/** Get the hierarchy node for a user */
export function getUserNode(email: string | undefined): TeamNode | null {
  const name = resolveUserName(email);
  if (!name) return null;
  if (name === "Sebastián Ruales") return teamHierarchy;
  return findNode(teamHierarchy, name) || null;
}

/** Get the user's area from the Excel mapping */
export function getUserArea(email: string | undefined): string | null {
  if (!email) return null;
  const lower = email.toLowerCase();
  return EMAIL_ROLE_MAP[lower]?.area || null;
}

/** Determine effective RBAC role from email + DB role */
export function getEffectiveRole(email: string | undefined, dbRole: AppRole | null): AppRole {
  if (!email) return "individual_contributor";
  const lower = email.toLowerCase();

  // Check hardcoded mapping first (from Excel "Acceso" column)
  const mapped = EMAIL_ROLE_MAP[lower];
  if (mapped) return mapped.role;

  // If DB has a role, use it
  if (dbRole) return dbRole;

  // Infer from hierarchy
  const node = getUserNode(email);
  if (!node) return "individual_contributor";

  const parent = findParent(teamHierarchy, node.name);
  if (parent?.name === "Sebastián Ruales") return "global_leader";
  if (node.directReports && node.directReports.length > 0) return "team_leader";

  return "individual_contributor";
}

export interface UserPermissions {
  /** User can see "Mi Equipo" tab */
  canSeeTeam: boolean;
  /** User can evaluate (calificar) direct reports */
  canEvaluate: boolean;
  /** User can see all people (global search) — super_admin only */
  canSearchGlobal: boolean;
  /** User can see company OKRs */
  canSeeOKRs: boolean;
  /** User can see eNPS dashboard */
  canSeeEnps: boolean;
  /** User can see Bia Academy */
  canSeeAcademy: boolean;
  /** User can see the Admin "Panel Empresa" */
  canSeeAdminPanel: boolean;
  /** User can see the QA / Data Validation panel */
  canSeeQA: boolean;
  /** Boolean: user is a manager (has direct reports or is leader role) */
  isManager: boolean;
  /** Boolean: user is admin (super_admin or global_leader) */
  isAdmin: boolean;
  /** The hierarchy root node for team views */
  teamRootNode: TeamNode | null;
  /** Hierarchy name of the current user */
  userName: string | null;
  /** The user's area */
  userArea: string | null;
  /** Manager name (direct boss) */
  managerName: string | null;
  /** The effective role */
  effectiveRole: AppRole;
}

/** Get full permissions for a user */
export function getUserPermissions(email: string | undefined, dbRole: AppRole | null): UserPermissions {
  const effectiveRole = getEffectiveRole(email, dbRole);
  const userName = resolveUserName(email);
  const userNode = getUserNode(email);
  const userArea = getUserArea(email);

  const isSuperAdmin = effectiveRole === "super_admin";
  const isGlobalLeader = effectiveRole === "global_leader";
  const isTeamLeader = effectiveRole === "team_leader";
  const isIC = effectiveRole === "individual_contributor";

  // For super_admins who are ICs in the hierarchy (e.g. People team),
  // find the area leader node so "Mi Equipo" shows their area's team
  let teamRootNode: TeamNode | null = userNode;
  if (isSuperAdmin && userNode && (!userNode.directReports || userNode.directReports.length === 0)) {
    // Try parent first, then search for area root
    const parent = findParent(teamHierarchy, userNode.name);
    if (parent) {
      teamRootNode = parent;
    }
  }

  const hasDirectReports = userNode?.directReports && userNode.directReports.length > 0;
  const isManagerFlag = isSuperAdmin || isGlobalLeader || isTeamLeader || !!hasDirectReports;
  const isAdminFlag = isSuperAdmin || isGlobalLeader;
  const parentNode = userNode ? findParent(teamHierarchy, userNode.name) : null;

  const enpsOnly = isEnpsOnlyUser(email);

  return {
    canSeeTeam: !enpsOnly && (isSuperAdmin || isGlobalLeader || isTeamLeader || !!hasDirectReports),
    canEvaluate: !enpsOnly && (isSuperAdmin || isGlobalLeader || isTeamLeader),
    canSearchGlobal: !enpsOnly && isSuperAdmin,
    canSeeOKRs: !enpsOnly,
    canSeeEnps: enpsOnly ? true : (isSuperAdmin || isGlobalLeader),
    canSeeAcademy: !enpsOnly,
    canSeeAdminPanel: !enpsOnly && isSuperAdmin,
    canSeeQA: !enpsOnly && (isSuperAdmin || isGlobalLeader),
    isManager: !enpsOnly && isManagerFlag,
    isAdmin: !enpsOnly && isAdminFlag,
    // Only fall back to the full tree for super_admins. For other roles, leaking the
    // root would expose Sebastián Ruales' team. Better to show an empty team than the wrong one.
    teamRootNode: teamRootNode || (isSuperAdmin ? teamHierarchy : null),
    userName,
    userArea,
    managerName: parentNode?.name || null,
    effectiveRole,
  };
}

/**
 * Get the list of people visible to a user based on their role:
 * - super_admin: everyone
 * - global_leader: everyone in their AREA
 * - team_leader: only their hierarchical subtree (recursive reports)
 * - individual_contributor: only themselves
 */
export function getVisiblePeople(email: string | undefined, dbRole: AppRole | null): TeamNode[] {
  const permissions = getUserPermissions(email, dbRole);
  const { effectiveRole, userArea } = permissions;

  if (effectiveRole === "super_admin") {
    return flattenTree(teamHierarchy);
  }

  if (effectiveRole === "global_leader") {
    // Filter all nodes by area
    return flattenTree(teamHierarchy).filter(n => n.area === userArea);
  }

  if (effectiveRole === "team_leader") {
    const userNode = getUserNode(email);
    if (!userNode) return [];
    return flattenTree(userNode); // includes self + all recursive reports
  }

  // individual_contributor: only self
  const userNode = getUserNode(email);
  return userNode ? [userNode] : [];
}

/**
 * Check if a user can access a specific person's data
 */
export function canAccessPerson(email: string | undefined, dbRole: AppRole | null, targetName: string): boolean {
  const visible = getVisiblePeople(email, dbRole);
  return visible.some(n => n.name === targetName);
}

/** Get the mockData owner name for a person */
export function getMockDataOwnerName(hierarchyName: string): string {
  const SHORT_TO_HIERARCHY: Record<string, string> = {
    "Sebastián Ruales": "Sebastián Ruales",
    "Katheryn Franco Ramirez": "Katheryn Franco",
    "Santiago Jiménez": "Santiago Jiménez",
    "Yoli Patricia Marín Calvache": "Yoli Marín",
    "Juan David Quijano Villegas": "Juan David Quijano",
    "Guillermo Andrés Cajamarca Mesa": "Guillermo Cajamarca",
    "Leonardo Velasquez Florez": "Leonardo Velásquez",
    "Manuel Leonardo Rodriguez Velasco": "Manuel Rodríguez",
    "Angela Maria Bedoya Salcedo": "Ángela Bedoya",
    "Paola Andrea Peralta Vargas": "Paola Peralta",
    "Guillermo Plaza Roche": "Guillermo Plaza",
    "Sheila Rocio Barreto Martínez": "Sheila Barreto",
  };
  // Case-insensitive lookup
  const lower = hierarchyName.toLowerCase();
  for (const [key, value] of Object.entries(SHORT_TO_HIERARCHY)) {
    if (key.toLowerCase() === lower) return value;
  }
  return hierarchyName;
}
