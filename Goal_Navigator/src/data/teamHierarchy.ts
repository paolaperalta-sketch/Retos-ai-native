/**
 * Hierarchical team structure built from Base_de_información.xlsx
 * using JEFE INMEDIATO → NOMBRE COLABORADOR relationships.
 */

export interface TeamNode {
  name: string;
  role: string;
  area: string;
  subarea: string;
  contribucion: "LÍDER" | "CONTRIBUIDOR INDIVIDUAL";
  directReports?: TeamNode[];
}

// CEO → VPs → Managers → ICs
export const teamHierarchy: TeamNode = {
  name: "Sebastián Ruales",
  role: "CEO",
  area: "EXECUTIVE",
  subarea: "EXECUTIVE",
  contribucion: "LÍDER",
  directReports: [
    // ── OPERACIONES ──
    {
      name: "Santiago Jiménez",
      role: "VP OF ACTIVATION",
      area: "OPERACIONES",
      subarea: "OPERACIONES",
      contribucion: "LÍDER",
      directReports: [
        { name: "Daniel Alejandro Moreno Arias", role: "CGM ANALYST", area: "OPERACIONES", subarea: "CGM", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Juan Pablo Aristizabal Galvis", role: "CGM ANALYST", area: "OPERACIONES", subarea: "CGM", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        {
          name: "Milton Esteban Reyes Parra",
          role: "LIDER DE CÓDIGO DE MEDIDA",
          area: "OPERACIONES",
          subarea: "CGM",
          contribucion: "LÍDER",
          directReports: [
            { name: "Harry Josehp Baquero Gonzalez", role: "TECHNICAL EXPERT", area: "OPERACIONES", subarea: "CGM", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Julian Martinez Portilla", role: "TECHNICAL EXPERT", area: "OPERACIONES", subarea: "CGM", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        {
          name: "Hernan Dario Manjarres Gomez",
          role: "SR. MANAGER FOPS",
          area: "OPERACIONES",
          subarea: "FIELDOPS",
          contribucion: "LÍDER",
          directReports: [
            { name: "Daniela Maria Bonfante Urango", role: "OPERATIONS ANALYST JR", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            {
              name: "Dinovi Jesus Sanchez Florez",
              role: "FIELD OPERATIONS PLANNER",
              area: "OPERACIONES",
              subarea: "FIELDOPS",
              contribucion: "LÍDER",
              directReports: [
                { name: "Edicson Eliecer Lopez Gomez", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Wilson Giovanni Capador Manrique", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Juan Camilo Jaramillo Betancur", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Carlos Arturo Salas Herrera", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Wilson Javier Fernandez Guerrero", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Jhojan Smith Gordillo Ramirez", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Juan Gabriel Reyes Mirke", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
            {
              name: "Ervison David Plata Mendoza",
              role: "FIELD OPERATIONS PLANNER",
              area: "OPERACIONES",
              subarea: "FIELDOPS",
              contribucion: "LÍDER",
              directReports: [
                { name: "Duvan Enrique Cervera Morales", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Jonathan Enrique Rudas Moran", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Jose Luis Arevalo Rivera", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Edwin Andres Cubides Calderon", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Sergio Rafael Peñate Villa", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Jorge Gelvez Chinchilla", role: "TÉCNICO ELECTRICISTA", area: "OPERACIONES", subarea: "FIELDOPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
          ],
        },
        {
          name: "Simon Rivera Gutierrez",
          role: "HEAD CUSTOMER OF OPS",
          area: "OPERACIONES",
          subarea: "SUCCESS",
          contribucion: "LÍDER",
          directReports: [
            { name: "Luisa Fernanda Camero Bejarano", role: "ACTIVATION ANALYST", area: "OPERACIONES", subarea: "SUCCESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Maria Paula Ardila Correa", role: "OPERATION ACCOUNT EXECUTIVE", area: "OPERACIONES", subarea: "SUCCESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Paola Alejandra Contreras Arciniegas", role: "OPERATION ACCOUNT EXECUTIVE", area: "OPERACIONES", subarea: "SUCCESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Laura Catherine Navas Rodriguez", role: "ENERGY SOLUTIONS SPECIALIST", area: "OPERACIONES", subarea: "SUCCESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "David Esteban Sierra Castillo", role: "OPERATION ACCOUNT EXECUTIVE", area: "OPERACIONES", subarea: "CUSTOMER SUCCESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            {
              name: "Laura Juliana Gomez Galvez",
              role: "SUPPLY COORDINATOR",
              area: "OPERACIONES",
              subarea: "SUPPLY",
              contribucion: "LÍDER",
              directReports: [
                { name: "Julian Abelardo Marta Arias", role: "ALMACENISTA", area: "OPERACIONES", subarea: "SUPPLY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Joel Nocua Contreras", role: "SUPPLY ANALYST JR", area: "OPERACIONES", subarea: "SUPPLY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Dayana Sirley Duitama Bustamante", role: "CGM ANALYST JR", area: "OPERACIONES", subarea: "CGM", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Agustin Antonio Serna Guevara", role: "ALMACENISTA", area: "OPERACIONES", subarea: "SUPPLY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
          ],
        },
      ],
    },

    // ── CX ──
    {
      name: "Katheryn Franco Ramirez",
      role: "HEAD OF CUSTOMER SERVICES",
      area: "CX",
      subarea: "CX",
      contribucion: "LÍDER",
      directReports: [
        { name: "Maria Camila Vásquez Navas", role: "LIDER DE MEJORA CONTINUA", area: "CX", subarea: "RETENTION", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        {
          name: "Juan Carlos Toro Betancur",
          role: "LEAD OF CUSTOMER SERVICES",
          area: "CX",
          subarea: "CONCIERGE",
          contribucion: "LÍDER",
          directReports: [
            { name: "Sindy Jerenny Durango Leal", role: "SENIOR ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Luz Estefany Hoyos Medina", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Lina Marcela Cataño Fernandez", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Ana Cristina Franco Ramírez", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Susan Juliana Vargas Chamorro", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Cristian Camilo Restrepo Pino", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Lizzeth Vanessa Obando Romero", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Dalia Juliana Gómez Ariza", role: "AUXILIAR ADMINISTRATIVA UX", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Andres Felipe Pelaez Alvarez", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Laura Angelica Medina Chaves", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Camila Andrea Marin Rincon", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Daniela Torres Garzón", role: "ENERGY CONCIERGE", area: "CX", subarea: "CONCIERGE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            {
              name: "Natalia Andrea Buritica Vera",
              role: "BUSINESS LEAD CUSTOMER SERVICE",
              area: "CX",
              subarea: "SERVICE",
              contribucion: "LÍDER",
              directReports: [
                { name: "Mitchell Madrid Hernandez", role: "CUSTOMER SERVICES SPECIALIST", area: "CX", subarea: "SERVICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Angy Daniela Rodriguez Gonzalez", role: "CUSTOMER SERVICES SPECIALIST", area: "CX", subarea: "SERVICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Maria Alejandra Rodriguez Valencia", role: "CUSTOMER SERVICES SPECIALIST", area: "CX", subarea: "SERVICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "María Fernanda Díaz Alvarez", role: "CUSTOMER SERVICES SPECIALIST", area: "CX", subarea: "SERVICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Rosaura Katherine López García", role: "CUSTOMER SERVICES SPECIALIST", area: "CX", subarea: "SERVICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
          ],
        },
        {
          name: "Damaris Katherine Castañeda Bermudez",
          role: "LEAD OF CUSTOMER SERVICES",
          area: "CX",
          subarea: "RETENTION",
          contribucion: "LÍDER",
          directReports: [
            { name: "Andrea Pemberty Osorno", role: "ENERGY CONCIERGE", area: "CX", subarea: "RETENTION", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
      ],
    },

    // ── SALES ──
    {
      name: "Yoli Patricia Marín Calvache",
      role: "VP OF SALES",
      area: "SALES",
      subarea: "SALES",
      contribucion: "LÍDER",
      directReports: [
        { name: "Daniela Dueñas Camacho", role: "KAM JR", area: "SALES", subarea: "SALES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Juan Pablo Blanco Lugo", role: "KAM JR", area: "SALES", subarea: "SALES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Yerson Andres Toro García", role: "KAM JR", area: "SALES", subarea: "SALES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Sebastian Mazorra Gomez", role: "KAM JR", area: "SALES", subarea: "SALES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Luz Milena Roman Tamara", role: "TRAINING MANAGER", area: "SALES", subarea: "TRAINING", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        {
          name: "Esteban Martinez Pinto",
          role: "HEAD OF SALES SUPPORT & DATA ANALYTICS",
          area: "SALES",
          subarea: "SALES OPS",
          contribucion: "LÍDER",
          directReports: [
            { name: "Shalliny Gisell Dominguez Luna", role: "SALES OPS ANALYST", area: "SALES", subarea: "SALES OPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Santiago Jose Salazar Astaiza", role: "REVENUE OPERATIONS ANALYST", area: "SALES", subarea: "SALES OPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Maria Fernanda Garzón Hueso", role: "CRM & AUTOMATION SPECIALIST", area: "SALES", subarea: "SALES OPS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        {
          name: "Maria Paula Pico Loaiza",
          role: "SALES COORDINATOR",
          area: "SALES",
          subarea: "SALES",
          contribucion: "LÍDER",
          directReports: [
            { name: "Shirly Alexandra Murillo Fagua", role: "KAM", area: "SALES", subarea: "SALES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Simon Hernandez Medina", role: "KAM JR", area: "SALES", subarea: "SALES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        {
          name: "Silvia Milena Uribe Gutierrez",
          role: "SENIOR STRATEGIC ACCOUNT MANAGER",
          area: "SALES",
          subarea: "UPSELLING",
          contribucion: "LÍDER",
        },
      ],
    },

    // ── MARKETING / GROWTH ──
    {
      name: "Juan David Quijano Villegas",
      role: "VP ACQUISITION",
      area: "MARKETING",
      subarea: "MARKETING",
      contribucion: "LÍDER",
      directReports: [
        { name: "Manuela Garcia Viera", role: "GROWTH ANALYST SENIOR", area: "MARKETING", subarea: "GROWTH", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Juan José Trujillo Trujillo", role: "BUSINESS DEVELOPMENT REPRESENTATIVE", area: "MARKETING", subarea: "GROWTH", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        {
          name: "Johana Casteblanco Mateus",
          role: "LEAD GRAPHIC DESIGNER BRAND",
          area: "MARKETING",
          subarea: "BRAND",
          contribucion: "LÍDER",
          directReports: [
            { name: "Juan David Reyes Estupiñan", role: "JUNIOR GRAPHIC DESIGNER", area: "MARKETING", subarea: "DESIGN", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        {
          name: "Santiago Ruales Duque",
          role: "HEAD OF PARTNERSHIPS",
          area: "MARKETING",
          subarea: "GROWTH",
          contribucion: "LÍDER",
          directReports: [
            { name: "Maria Ines Torres Viada", role: "GROWTH ANALYST SENIOR", area: "MARKETING", subarea: "GROWTH", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        {
          name: "Michael Steven Vargas Martínez",
          role: "AUDIOVISUAL CONTENT LEAD",
          area: "MARKETING",
          subarea: "BRAND",
          contribucion: "LÍDER",
          directReports: [
            { name: "Marylin Jisseth Ocampo Vargas", role: "ANALISTA JUNIOR DE PRODUCCIÓN AUDIOVISUAL", area: "MARKETING", subarea: "BRAND", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
      ],
    },

    // ── FINANCE ──
    {
      name: "Manuel Leonardo Rodriguez Velasco",
      role: "VP OF FINANCE & ADMIN",
      area: "FINANCE",
      subarea: "FINANCE",
      contribucion: "LÍDER",
      directReports: [
        { name: "Erika Tatiana Ramírez Pachon", role: "ANALISTA DE LIQUIDACIONES", area: "FINANCE", subarea: "LIQUIDACIONES", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        {
          name: "Paola Del Rocio Satizabal",
          role: "HEAD OF TREASURY",
          area: "FINANCE",
          subarea: "TREASURY",
          contribucion: "LÍDER",
          directReports: [
            { name: "Carolina Ardila Montes", role: "COORDINADORA DE FIDUCIAS", area: "FINANCE", subarea: "TREASURY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            {
              name: "Annabell Cardona Espitia",
              role: "BILLING & COLLECTION MANAGER",
              area: "FINANCE",
              subarea: "TREASURY",
              contribucion: "LÍDER",
              directReports: [
                {
                  name: "Cristian David Romero Higuera",
                  role: "BILLING & COLLECTIONS COORDINATOR",
                  area: "FINANCE",
                  subarea: "TREASURY",
                  contribucion: "LÍDER",
                  directReports: [
                    { name: "Angie Juliana Miranda Sanguino", role: "BILLING & COLLECTION ANALYST", area: "FINANCE", subarea: "TREASURY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                  ],
                },
              ],
            },
            {
              name: "Diana Milena Suarez Perez",
              role: "TREASURY MANAGER",
              area: "FINANCE",
              subarea: "TREASURY",
              contribucion: "LÍDER",
              directReports: [
                { name: "Marolin Vanessa Rivas Rosario", role: "ANALISTA DE TESORERIA", area: "FINANCE", subarea: "TREASURY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Cristian Felipe Diaz Osorio", role: "TREASURY ANALYST", area: "FINANCE", subarea: "TREASURY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
          ],
        },
        {
          name: "Andrea Catherine Lozano Amezquita",
          role: "HEAD OF ACCOUNTING & TAX",
          area: "FINANCE",
          subarea: "ACCOUNTING & TAX",
          contribucion: "LÍDER",
          directReports: [
            {
              name: "Daniela Alejandra Carvajal Mahecha",
              role: "ACCOUNTING COORDINATOR",
              area: "FINANCE",
              subarea: "ACCOUNTING & TAX",
              contribucion: "LÍDER",
              directReports: [
                { name: "Julian David Acevedo Yara", role: "ANALISTA CONTABLE", area: "FINANCE", subarea: "ACCOUNTING & TAX", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Julian Felipe Rodriguez Hernandez", role: "ANALISTA JR DE CONTABILIDAD", area: "FINANCE", subarea: "ACCOUNTING & TAX", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
            {
              name: "Julieth Katerine Rincon Medellin",
              role: "TAX COORDINATOR",
              area: "FINANCE",
              subarea: "ACCOUNTING & TAX",
              contribucion: "LÍDER",
              directReports: [
                { name: "Angie Tatiana Guerrero Zambrano", role: "TAX JUNIOR", area: "FINANCE", subarea: "ACCOUNTING & TAX", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Luisa Fernanda Rada Lozano", role: "ANALISTA SR DE IMPUESTOS", area: "FINANCE", subarea: "ACCOUNTING & TAX", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
          ],
        },
        {
          name: "Natalia Carvajal Carvajal",
          role: "FP&A MANAGER",
          area: "FINANCE",
          subarea: "FP&A",
          contribucion: "LÍDER",
          directReports: [
            { name: "Jeison Santiago Niño Gomez", role: "FP&A ANALYST", area: "FINANCE", subarea: "FP&A", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
      ],
    },

    // ── LEGAL ──
    {
      name: "Angela Maria Bedoya Salcedo",
      role: "HEAD OF LEGAL AND COMPLIANCE OFFICER",
      area: "LEGAL",
      subarea: "LEGAL",
      contribucion: "LÍDER",
      directReports: [
        {
          name: "Ernesto Carlos Torres Rojas",
          role: "SENIOR CORPORATE & COMPLIANCE ATTORNEY",
          area: "LEGAL",
          subarea: "LEGAL",
          contribucion: "CONTRIBUIDOR INDIVIDUAL",
          directReports: [
            { name: "Andres Felipe Aristizabal Urina", role: "JUNIOR ENERGY ATTORNEY", area: "LEGAL", subarea: "LEGAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        { name: "Valentina Garcia Muñoz", role: "SENIOR ENERGY ATTORNEY", area: "LEGAL", subarea: "LEGAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Ximena Canal Andrade", role: "CORPORATE AND COMPLIANCE ATTORNEY SENIOR", area: "LEGAL", subarea: "LEGAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Sergio Ivan Reboleldo Herrera", role: "ENERGY ATTORNEY", area: "LEGAL", subarea: "LEGAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
      ],
    },

    // ── PEOPLE ──
    {
      name: "Paola Andrea Peralta Vargas",
      role: "PEOPLE MANAGER",
      area: "PEOPLE",
      subarea: "PEOPLE",
      contribucion: "LÍDER",
      directReports: [
        { name: "Karen Eliana Villamil Hernandez", role: "SR. TALENT ACQUISITION SPECIALIST", area: "PEOPLE", subarea: "PEOPLE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Sheila Rocio Barreto Martínez", role: "ESPECIALISTA SST", area: "PEOPLE", subarea: "PEOPLE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "María Lucía Velasco Acosta", role: "PEOPLE OPS ANALYST", area: "PEOPLE", subarea: "PEOPLE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
      ],
    },

    // ── NEW BUSINESS / COO ──
    {
      name: "Leonardo Velasquez Florez",
      role: "CHIEF OPERATING OFFICER",
      area: "COMPANY",
      subarea: "OPERATIONS",
      contribucion: "LÍDER",
      directReports: [
        { name: "Alvaro Andrés Romero Jiménez", role: "SOLUTIONS ENGINEER", area: "NEW BUSINESS", subarea: "NEW BUSINESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Andres Camilo Herrera Osorio", role: "SOLUTIONS ENGINEER", area: "NEW BUSINESS", subarea: "NEW BUSINESS", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
      ],
    },

    // ── COMPANY / CHIEF OF STAFF ──
    { name: "Francesca Citarella Polo", role: "CHIEF OF STAFF", area: "COMPANY", subarea: "COMPANY", contribucion: "CONTRIBUIDOR INDIVIDUAL" },

    // ── ENERGY ──
    {
      name: "Guillermo Andrés Cajamarca Mesa",
      role: "ENERGY MANAGER",
      area: "ENERGY",
      subarea: "ENERGY",
      contribucion: "LÍDER",
      directReports: [
        {
          name: "Nohora Consuelo Mesa Castañeda",
          role: "HEAD OF ENERGY TRADING",
          area: "ENERGY",
          subarea: "ENERGY TRADING",
          contribucion: "LÍDER",
          directReports: [
            { name: "Juliana Bonilla Tapia", role: "ENERGY TRANSACTION LEADER", area: "ENERGY", subarea: "ENERGY TRADING", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Allison Cubillos Andrade", role: "ENERGY TRADING ANALYST", area: "ENERGY", subarea: "ENERGY TRADING", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Laura Sofia Correa Arias", role: "ENERGY TRADING ANALYST", area: "ENERGY", subarea: "ENERGY TRADING", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
      ],
    },

    // ── TECNOLOGÍA (CTO: Guillermo Plaza) ──
    {
      name: "Guillermo Plaza Roche",
      role: "CTO",
      area: "TECNOLOGÍA",
      subarea: "TECNOLOGÍA",
      contribucion: "LÍDER",
      directReports: [
        { name: "Olga Gabriella Rey Sarmiento", role: "PRODUCT MANAGER", area: "TECNOLOGÍA", subarea: "PRODUCT", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Isabela Botero Molina", role: "PRODUCT MANAGER", area: "TECNOLOGÍA", subarea: "PRODUCT", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Daniela Alejandra Serrano Díaz", role: "PRODUCT DESIGNER", area: "TECNOLOGÍA", subarea: "PRODUCT", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Maria Camila Nariño Guevara", role: "PRODUCT MANAGER", area: "TECNOLOGÍA", subarea: "PRODUCT", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        { name: "Kelly Tatiana Moreno Arenas", role: "PRODUCT DESIGNER", area: "TECNOLOGÍA", subarea: "PRODUCT", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
        {
          name: "Juan Sebastián Bautista Grillo",
          role: "HEAD OF LIFECYCLE",
          area: "TECNOLOGÍA",
          subarea: "PRODUCT",
          contribucion: "LÍDER",
        },
        {
          name: "Diego Alfonso Suárez Mayorga",
          role: "VP OF ENGINEERING (BACKOFFICE)",
          area: "TECNOLOGÍA",
          subarea: "INTERNAL",
          contribucion: "LÍDER",
          directReports: [
            {
              name: "Byron David Ortega Sánchez",
              role: "TECH BACK ENGINEER",
              area: "TECNOLOGÍA",
              subarea: "INTERNAL",
              contribucion: "LÍDER",
              directReports: [
                { name: "Angie Jinet Pacheco Cubillos", role: "BACKEND DEVELOPER", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Mayerly Rocio Enriquez Lopez", role: "ENGINEER LEAD", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Mateo Ortiz Ramirez", role: "FRONTEND DEVELOPER JUNIOR", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Cristian Andres Bustamante Caro", role: "BACKEND DEVELOPER", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Daniel Felipe Rivera Arroyave", role: "SENIOR BACKEND DEVELOPER", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
            { name: "Jeremy Antony Bolaños Vásquez", role: "TECH BACK ENGINEER", area: "TECNOLOGÍA", subarea: "EXTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Astrid Julieth Tovar Torres", role: "TECH FRONT ENGINEER", area: "TECNOLOGÍA", subarea: "EXTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            {
              name: "John Charles Aponte Solano",
              role: "SR BACKEND ACTIVATION",
              area: "TECNOLOGÍA",
              subarea: "EXTERNAL",
              contribucion: "LÍDER",
              directReports: [
                { name: "Juan Nicolas Romero Bobadilla", role: "TECHOPS AUTOMATION", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Sergio Esteban Peñaranda Duarte", role: "FRONTEND DEVELOPER MID", area: "TECNOLOGÍA", subarea: "EXTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
            { name: "Juan David Benavides Fiallo", role: "PRACTICANTE TECH", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Alvaro Javier Martinez Duran", role: "DESARROLLADOR BACKEND GOLANG", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Cristian Orlando Quintero Rodriguez", role: "FRONTEND DEVELOPER", area: "TECNOLOGÍA", subarea: "BACKOFFICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            {
              name: "William Guillermo Lizcano Ramirez",
              role: "QA LEAD",
              area: "TECNOLOGÍA",
              subarea: "INTERNAL",
              contribucion: "LÍDER",
              directReports: [
                { name: "Karen Esteffani Diaz Beleño", role: "QA FUNCIONAL MID", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Juan Jose Cortes Rodriguez", role: "QA FUNCIONAL JR", area: "TECNOLOGÍA", subarea: "EXTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Yesika Alejandra Vanegas Chacon", role: "QA MID", area: "TECNOLOGÍA", subarea: "INTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Nestor Orlando Castro Suárez", role: "QA ANALYST MID", area: "TECNOLOGÍA", subarea: "EXTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
                { name: "Juan David Castillo Laverde", role: "QA ANALYST JUNIOR", area: "TECNOLOGÍA", subarea: "EXTERNAL", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
              ],
            },
          ],
        },
        {
          name: "Juan Camilo Otavo Eslava",
          role: "LEAD OF AI & AUTOMATION",
          area: "TECNOLOGÍA",
          subarea: "AI & AUTOMATION",
          contribucion: "LÍDER",
          directReports: [
            { name: "Laura Andrea Gonzalez Rodriguez", role: "JR PRODUCT ANALYST OF AI & AUTOMATION", area: "TECNOLOGÍA", subarea: "AI & AUTOMATION", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Miriam Zareth Osorio Mendoza", role: "QA FUNCIONAL JR", area: "TECNOLOGÍA", subarea: "QA", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Andres David Caro Mora", role: "AI & AUTOMATION INTERN", area: "TECNOLOGÍA", subarea: "AI & AUTOMATION", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Diego Alejandro García Pinto", role: "AGENTIC AI ENGINEER SSR", area: "TECNOLOGÍA", subarea: "AI & AUTOMATION", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Tatiana Toro Gómez", role: "AGENTIC AI ENGINEER SSR", area: "TECNOLOGÍA", subarea: "AI & AUTOMATION", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
        {
          name: "Luis Fernando Gonzalez Perez",
          role: "ENERGY BI MANAGER",
          area: "TECNOLOGÍA",
          subarea: "DATA",
          contribucion: "LÍDER",
          directReports: [
            { name: "Juan David Salazar Marin", role: "JR DATA & ML ANALYST", area: "TECNOLOGÍA", subarea: "DATA", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Maria Angelica Espinel Poveda", role: "CUSTOMER SERVICES SPECIALIST", area: "CX", subarea: "SERVICE", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Cristian Leonardo Guerrero Tique", role: "JR DATA ENGINEER", area: "TECNOLOGÍA", subarea: "DATA", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Camilo Andres Caceres Fontecha", role: "SENIOR DATA ENGINEER", area: "TECNOLOGÍA", subarea: "DATA", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
            { name: "Diego Andrés Barrero Rosero", role: "JR DATA & ML ANALYST", area: "TECNOLOGÍA", subarea: "DATA", contribucion: "CONTRIBUIDOR INDIVIDUAL" },
          ],
        },
      ],
    },

    // ── FINANCE (Procurement) – Yineth (not in employee list, but manages Laura Valentina) ──
    // Laura Valentina reports to Yineth who is under Finance Procurement. Placing under Manuel.
  ],
};

// Handle orphan: Laura Valentina Vargas Mateus reports to Yineth Jazbleydy Mendoza Ortiz (PROCUREMENT FINANCE)
// Yineth is not in the employee list – placing Laura Valentina under Manuel Rodriguez
const manuelNode = findNode(teamHierarchy, "Manuel Leonardo Rodriguez Velasco");
if (manuelNode) {
  if (!manuelNode.directReports) manuelNode.directReports = [];
  manuelNode.directReports.push({
    name: "Laura Valentina Vargas Mateus",
    role: "AUXILIAR ADMINISTRATIVA",
    area: "FINANCE",
    subarea: "PROCUREMENT FINANCE",
    contribucion: "CONTRIBUIDOR INDIVIDUAL",
  });
}

/** Flatten all nodes in the tree */
export function flattenTree(node: TeamNode): TeamNode[] {
  const result: TeamNode[] = [node];
  if (node.directReports) {
    for (const child of node.directReports) {
      result.push(...flattenTree(child));
    }
  }
  return result;
}

/** Find a node by name */
export function findNode(root: TeamNode, name: string): TeamNode | undefined {
  if (root.name.toLowerCase() === name.toLowerCase()) return root;
  for (const child of root.directReports || []) {
    const found = findNode(child, name);
    if (found) return found;
  }
  return undefined;
}

/** Count all people under a node (excluding self) */
export function countReports(node: TeamNode): number {
  if (!node.directReports) return 0;
  return node.directReports.reduce((sum, child) => sum + 1 + countReports(child), 0);
}

/** Find the parent (boss) of a person */
export function findParent(root: TeamNode, name: string): TeamNode | undefined {
  for (const child of root.directReports || []) {
    if (child.name.toLowerCase() === name.toLowerCase()) return root;
    const found = findParent(child, name);
    if (found) return found;
  }
  return undefined;
}

/** Get teammates (people who share the same boss) */
export function getTeammates(root: TeamNode, name: string): TeamNode[] {
  const parent = findParent(root, name);
  if (!parent?.directReports) return [];
  return parent.directReports.filter(n => n.name !== name);
}

/** Get all unique areas */
export function getAllAreas(node: TeamNode): string[] {
  const areas = new Set<string>();
  const collect = (n: TeamNode) => {
    areas.add(n.area);
    for (const c of n.directReports || []) collect(c);
  };
  collect(node);
  return Array.from(areas).sort();
}

/** Get all unique subareas for a given area */
export function getSubareas(node: TeamNode, area: string): string[] {
  const subareas = new Set<string>();
  const collect = (n: TeamNode) => {
    if (n.area === area) subareas.add(n.subarea);
    for (const c of n.directReports || []) collect(c);
  };
  collect(node);
  return Array.from(subareas).sort();
}
