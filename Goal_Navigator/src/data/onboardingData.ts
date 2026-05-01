// Onboarding data: days, sections, videos, quizzes

export interface OnboardingVideo {
  id: string;
  title: string;
  objective: string;
  url: string | null; // null = "Próximamente"
}

export interface OnboardingSection {
  title: string;
  videos: OnboardingVideo[];
}

export interface OnboardingDay {
  id: number;
  title: string;
  objective: string;
  sections: OnboardingSection[];
  hasBreak?: { afterVideoIndex: number; label: string };
  quizAfter?: "quiz1" | "quiz2";
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number | number[]; // number[] for multi-select
  type: "single" | "multi" | "truefalse" | "text";
  correctTextAnswers?: string[]; // for text type
}

// ─── DAY DATA ───

export const ONBOARDING_DAYS: OnboardingDay[] = [
  {
    id: 1,
    title: "Configura tus herramientas iniciales",
    objective: "Garantizar que el colaborador cuente con las herramientas necesarias para el desarrollo de sus funciones desde el día 1.",
    sections: [
      {
        title: "Configura tus herramientas iniciales",
        videos: [
          { id: "d1-v1", title: "Aquí empieza tu reto", objective: "Conocer el punto de partida del proceso de onboarding y lo que aprenderás.", url: "https://drive.google.com/file/d/1VuB79gNgmJ076Gg5HUAwy3TIoIlWZZlG/preview" },
          { id: "d1-v2", title: "Firma y foto Gmail", objective: "Configurar correctamente la identidad visual en el correo corporativo.", url: "https://drive.google.com/file/d/12QNAHUjAAGmVkOgSRKhOvvN6ujJHEOzX/preview" },
          { id: "d1-v3", title: "Slack", objective: "Aprender a usar Slack como herramienta principal de comunicación interna.", url: "https://drive.google.com/file/d/1Zgw9DzCLj-kcJ464GdNknFg5SDtfbbc0/preview" },
          { id: "d1-v4", title: "LinkedIn", objective: "Optimizar el perfil de LinkedIn alineado con la marca Bia.", url: "https://drive.google.com/file/d/1EqW2QT5hj4C6Xd89Lm0CNt3tIgpueP88/preview" },
          { id: "d1-v5", title: "People Space", objective: "Conocer el espacio de cultura y bienestar del equipo Bia.", url: "https://drive.google.com/file/d/1idc5NxITYCPSRRI2gQPsVkf4DwFAAxD2/preview" },
          { id: "d1-v6", title: "Fondo de llamada", objective: "Configurar el fondo oficial de Bia para videollamadas.", url: "https://drive.google.com/file/d/1RAZx4FKCjGijPzVq0L8_vxzTTP3F8cY7/preview" },
        ],
      },
      {
        title: "Buk",
        videos: [
          { id: "d1-v7", title: "Introducción Buk", objective: "Entender qué es Buk y cómo usarlo para gestionar tu información laboral.", url: "https://drive.google.com/file/d/1I7vlmrbpbFHPVvHY0Cd6haRELbleMXh_/preview" },
          { id: "d1-v8", title: "Vacaciones", objective: "Conocer el proceso para solicitar vacaciones a través de Buk.", url: "https://drive.google.com/file/d/1cTviYkIWaF4DXY2obxm7D3DhgCeN2k3L/preview" },
          { id: "d1-v9", title: "Media día de vacaciones", objective: "Aprender a gestionar solicitudes de medio día de descanso.", url: "https://drive.google.com/file/d/1SgJhqXR1tsWTotXpM_dUFP5hB_yQodVH/preview" },
          { id: "d1-v10", title: "Certificado laboral y nómina", objective: "Saber cómo descargar certificados laborales y colillas de pago.", url: "https://drive.google.com/file/d/1VnhQTqSKYaw63yCFqVei-aRTokXOzI_5/preview" },
          { id: "d1-v11", title: "Día de la familia", objective: "Conocer el beneficio del día de la familia y cómo solicitarlo.", url: "https://drive.google.com/file/d/1h4s75GHK6DwAflkZWJ1_qdNIaRldeZnz/preview" },
          { id: "d1-v12", title: "Incapacidades", objective: "Entender el proceso de reporte y gestión de incapacidades médicas.", url: "https://drive.google.com/file/d/1aT4Vjbe-yVRrbfRyk8aV9gF7JICL9Xvm/preview" },
          { id: "d1-v13", title: "Licencia de Luto", objective: "Conocer el proceso para solicitar licencia de luto según la política Bia.", url: "https://drive.google.com/file/d/1H_Qone5iSOKBeJSgaLXGvRJNQa6sW7G2/preview" },
        ],
      },
      {
        title: "Seguridad y salud en el trabajo",
        videos: [
          { id: "d1-v14", title: "Seguridad y salud en el trabajo", objective: "Conocer las políticas de seguridad y salud laboral que aplican en Bia.", url: "https://drive.google.com/file/d/1f8yE4Nmcirhac9rOQLZfvn6ld9EXCBwa/preview" },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Conoce BIA y el sector energético",
    objective: "Proporcionar la información necesaria y facilitar un comienzo productivo a través del conocimiento de la cultura BIA y el sector energético.",
    sections: [
      {
        title: "Cultura BIA y Sector Energético",
        videos: [
          { id: "d2-v1", title: "ADN y contexto BIA", objective: "Comprender la historia, cultura, misión y visión de Bia para alinearte con su ADN desde el primer día.", url: "https://drive.google.com/file/d/1LlbCbCTq35tdRQkEGKVAJSzWkt7f5mLJ/preview" },
          { id: "d2-v2", title: "Fundamentos y arquitectura del Sector Energético", objective: "Conceptualizar las generalidades del sector energético colombiano y sus actores principales.", url: "https://drive.google.com/file/d/1mVQJ70SoHQI6epWys6EhyzVecoBHjBiG/preview" },
          { id: "d2-v3", title: "Estructura tarifaria y componentes clave", objective: "Dominar la arquitectura del Costo Unitario (CU) y los niveles de tensión para analizar la competitividad de la tarifa frente al mercado.", url: "https://drive.google.com/file/d/12XSCkCTa_ea8cteVNyJ-JHkJOrEOKwZf/preview" },
          { id: "d2-v4", title: "Proceso de Operaciones – Operadores de red y comercializadores", objective: "Comprender las funciones e interdependencia de los actores del sistema para interpretar cómo sus decisiones operativas y regulatorias impactan a Bia.", url: "https://drive.google.com/file/d/1Cb4FMGba6yms2OnT5v2fE2LHRV8z0ftN/preview" },
        ],
      },
      {
        title: "Compliance y Facturación",
        videos: [
          { id: "d2-v5", title: "Compliance", objective: "Apropiar las políticas de integridad y mejores prácticas para mitigar riesgos y asegurar una operación transparente en Bia.", url: null },
          { id: "d2-v6", title: "Arquitectura del modelo de facturación", objective: "Comprender el ciclo de facturación y la liquidación de la tarifa Bia para asegurar precisión en el recaudo, cumplimiento tributario y gestión de cartera.", url: null },
        ],
      },
      {
        title: "Marco regulatorio y sostenibilidad",
        videos: [
          { id: "d2-v7", title: "Marco Normativo y regulatorio", objective: "Analizar la regulación vigente y sus entes de control para garantizar que los procesos operativos cumplan estrictamente con la ley.", url: "https://drive.google.com/file/d/1mDqCWhIEPJmkAqwwVjohND2jgeOhSqIi/preview" },
          { id: "d2-v8", title: "Gestión de contribución de solidaridad y Distrito", objective: "Dominar el marco legal y técnico de la contribución y los beneficios para distritos de riego, garantizando una liquidación tarifaria exacta.", url: "https://drive.google.com/file/d/1ZnDAAhOx9hX4bpARAuw3sCvfkbArqFmI/preview" },
          { id: "d2-v9", title: "Certificados de Energía Renovable (REC)", objective: "Comprender la gestión y valorización de los RECs para ofrecer soluciones de sostenibilidad que permitan certificar origen renovable y cumplir metas ambientales.", url: "https://drive.google.com/file/d/1LHma4sIxsi-o1bledeLqmKu5Mt37cuYK/preview" },
        ],
      },
    ],
    hasBreak: { afterVideoIndex: 3, label: "☕ Descanso antes de Compliance — 20 minutos" },
    quizAfter: "quiz1",
  },
  {
    id: 3,
    title: "Autogeneración, Data y cierre",
    objective: "Cerrar el proceso de inmersión dominando los conceptos de autogeneración solar, el rol del área de Data y las métricas clave del negocio.",
    sections: [
      {
        title: "Autogeneración y Data",
        videos: [
          { id: "d3-v1", title: "AGPE – Autogeneración a Pequeña Escala", objective: "Comprender el marco regulatorio y comercial de la autogeneración solar para gestionar clientes AGPE y la venta de excedentes a la red.", url: null },
          { id: "d3-v2", title: "Área de Data en Bia", objective: "Entender el rol estratégico del área de Data, cómo convierte datos en decisiones y su impacto en la operación comercial.", url: null },
          { id: "d3-v3", title: "Métricas y KPIs del negocio", objective: "Conocer los indicadores clave que miden el éxito de Bia y cómo cada área contribuye a ellos.", url: null },
          { id: "d3-v4", title: "Cierre y próximos pasos", objective: "Consolidar el aprendizaje de los 3 días y entender los próximos pasos en tu rol dentro de Bia.", url: null },
        ],
      },
    ],
    quizAfter: "quiz2",
  },
];

// ─── QUIZ DATA ───

export const QUIZ_1: QuizQuestion[] = [
  {
    id: "q1-1", type: "single",
    question: "¿Qué es Bia en la industria de la energía?",
    options: [
      "Operador de red encargado de infraestructura física y generación",
      "Plataforma de software que solo vende medidores inteligentes",
      "Ente regulador gubernamental que supervisa precios del kWh",
      "Uno de los comercializadores de energía de mayor crecimiento en el país, que utiliza tecnología para optimizar el consumo",
    ],
    correctIndex: 3,
  },
  {
    id: "q1-2", type: "single",
    question: "¿Cuál es el núcleo de la misión de Bia?",
    options: [
      "Empoderar a los usuarios con herramientas tecnológicas innovadoras para controlar su consumo, reemplazando actores tradicionales",
      "Convertirse en el mayor generador de energía hidráulica del país",
      "Instalación masiva de paneles solares en hogares residenciales",
      "Regular los precios de los Operadores de Red mediante decretos gubernamentales",
    ],
    correctIndex: 0,
  },
  {
    id: "q1-3", type: "single",
    question: "¿Cuál es la visión de Bia para los próximos años?",
    options: [
      "Ser el estándar del servicio de energía en la región, basándose en el conocimiento profundo del usuario para generar ahorros y ganancias",
      "Construir la central hidroeléctrica más grande de Colombia",
      "Sustituir a todos los Operadores de Red",
      "Posicionarse exclusivamente por la venta de medidores inteligentes",
    ],
    correctIndex: 0,
  },
  {
    id: "q1-4", type: "single",
    question: "Dentro de nuestras OUR KEY PRIORITIES, encontramos: Services, Cash y...",
    options: [
      "Competitiveness & Product",
      "Competitiveness & Technology",
      "Product & Legal",
      "Product & Marketing",
    ],
    correctIndex: 0,
  },
  {
    id: "q1-5", type: "single",
    question: "¿Qué es la telemedida y cuál es su principal beneficio para el cliente?",
    options: [
      "Sistema que permite al cliente medir manualmente su energía",
      "Lectura remota y automática del consumo cada 15 minutos, eliminando errores de lectura manual",
      "Dispositivo que controla remotamente el flujo eléctrico",
      "Herramienta que permite leer manualmente el consumo si hay internet satelital",
    ],
    correctIndex: 1,
  },
  {
    id: "q1-6", type: "single",
    question: "Según el Brand Voice, ¿cómo debe comunicarse Bia?",
    options: [
      "Con autoridad técnica extrema y lenguaje complejo",
      "Como mentora cercana, segura y moderna; lenguaje sencillo, sin humillar a la competencia ni usar tecnicismos innecesarios",
      "De forma agresiva y disruptiva señalando errores de operadores tradicionales",
      "Como asistente robótico y neutral, solo datos numéricos",
    ],
    correctIndex: 1,
  },
  {
    id: "q1-7", type: "single",
    question: "¿Cuáles son los eslabones de la cadena de energía en Colombia?",
    options: [
      "Generación, Transmisión, Distribución y Comercialización",
      "Extracción, Refinación, Transporte y Venta al público",
      "Producción, Almacenamiento, Cableado y Facturación",
      "Transformación, Conducción, Medición y Regulación",
    ],
    correctIndex: 0,
  },
  {
    id: "q1-8", type: "single",
    question: "¿Qué significan las siglas OR y cuál es la función de XM y la CREG?",
    options: [
      "OR es Operador de Red; XM vende cables y CREG recauda impuestos",
      "OR es Operador de Red (dueño de los cables); XM administra el mercado mayorista y CREG dicta las normas y tarifas",
      "OR es Orden de Recaudo; XM es el comercializador; CREG es el gremio eléctrico",
      "OR es Operación Remota; XM es marca de medidores; CREG dicta normas",
    ],
    correctIndex: 1,
  },
  {
    id: "q1-9", type: "single",
    question: "¿Qué componentes de la tarifa (CU) NO dependen del comercializador?",
    options: [
      "Generación (G), Transmisión (T), Distribución (D), Pérdidas (P) y Restricciones (R)",
      "Transmisión (T), Pérdidas (P), Restricciones (R)",
      "Transmisión (T), Distribución (D), Pérdidas (P), Restricciones (R)",
      "Generación (G), Transmisión (T), Distribución (D), Pérdidas (P)",
    ],
    correctIndex: 2,
  },
  {
    id: "q1-10", type: "single",
    question: "¿Qué tipos de energía mide un medidor inteligente de Bia?",
    options: [
      "Niveles de tensión del rango 1 kV a 30 kV",
      "Energía Activa, Reactiva Inductiva y Reactiva Capacitiva",
      "Conexiones directas y semidirectas",
      "Energía de Baja Tensión y Energía de Alta Tensión únicamente",
    ],
    correctIndex: 1,
  },
  {
    id: "q1-11", type: "single",
    question: "¿Cuál enumera correctamente los departamentos de la compañía?",
    options: [
      "Energy, Marketing, Ventas, Operaciones, Finanzas, CX, Tech & Producto, Legal y People",
      "Energy, Marketing, Ventas, Operaciones",
      "Finanzas, CX, Tech & Producto, Legal y People",
      "Energy, Marketing, Ventas, Operaciones, Finanzas, CX, Tech & Producto, Legal, People y Front",
    ],
    correctIndex: 0,
  },
];

export const QUIZ_2: QuizQuestion[] = [
  {
    id: "q2-1", type: "single",
    question: "¿Cuál es un impuesto de orden municipal que Bia recauda a través de su factura?",
    options: [
      "Impuesto al Valor Agregado (IVA)",
      "Contribución de Solidaridad",
      "Impuesto de Alumbrado Público",
      "Tasa por Congestión Urbana",
    ],
    correctIndex: 2,
  },
  {
    id: "q2-2", type: "multi",
    question: "¿Cuál es el procedimiento correcto según SAGRILAFT? (Selecciona las 2 correctas)",
    options: [
      "Aceptar la solicitud para no perder el negocio",
      "Solicitarle directamente sus documentos para verificación en listas restrictivas",
      "Reconocer como Señal de Alerta, documentar y reportar al Oficial de Cumplimiento sin aceptar la solicitud",
      "Rechazar de inmediato e informar al cliente que su petición es sospechosa",
    ],
    correctIndex: [1, 2],
  },
  {
    id: "q2-3", type: "single",
    question: "Las visitas que realiza BIA al punto físico dentro del proceso normal de cambio de comercializador son:",
    options: [
      "Visita previa y visita de instalación",
      "Visita previa, visita de instalación, visita de cotización",
      "Visita de desconexión, visita previa, visita de telemedida",
    ],
    correctIndex: 0,
  },
  {
    id: "q2-4", type: "single",
    question: "¿Cómo se liquida la contribución de solidaridad?",
    options: [
      "Es el 20% del valor facturado por consumo de energía por cada frontera: Energía activa + energía reactiva",
      "Es el 20% del valor facturado por consumo exclusivo de energía activa",
      "Es el 20% del valor facturado por consumo exclusivo de energía reactiva",
    ],
    correctIndex: 0,
  },
  {
    id: "q2-5", type: "truefalse",
    question: "\"El beneficio de exención se otorga para prestadores del servicio público urbano de transporte masivo de pasajeros, respecto de la energía que efectivamente destinen a la carga o propulsión de vehículos eléctricos...\"",
    options: ["Falso", "Verdadero"],
    correctIndex: 1,
  },
  {
    id: "q2-6", type: "truefalse",
    question: "\"Las empresas que adoptan los RECs son percibidas como líderes en sostenibilidad. Demuestra un compromiso real con el medio ambiente...\"",
    options: ["Falso", "Verdadero"],
    correctIndex: 1,
  },
  {
    id: "q2-7", type: "single",
    question: "¿Cuál es el principal objetivo del área de Data en la empresa?",
    options: [
      "Guardar la mayor cantidad de datos posible sin importar su calidad",
      "Hacer reportes solo cuando alguien los pide",
      "Convertir datos en información confiable para tomar decisiones y generar valor",
      "Reemplazar todas las decisiones humanas con modelos",
    ],
    correctIndex: 2,
  },
  {
    id: "q2-8", type: "text",
    question: "¿Cuál es la fecha de vencimiento de la factura?",
    options: [],
    correctIndex: -1,
    correctTextAnswers: ["15", "día 15", "el 15", "15 de cada mes", "el 15 de cada mes", "dia 15", "el dia 15"],
  },
  {
    id: "q2-9", type: "single",
    question: "¿Cuál es el hito regulatorio que marca el inicio formal de la venta de excedentes de energía solar de un usuario a Bia?",
    options: [
      "Cuando se completa la instalación física de los paneles",
      "A partir del momento en que XM (Administrador del Mercado) aprueba el registro de la frontera",
      "Cuando el cliente firma el contrato con Bia y descarga la app",
      "Inmediatamente después de que el OR emita el certificado RETIE",
    ],
    correctIndex: 1,
  },
  {
    id: "q2-10", type: "single",
    question: "¿Qué significan las siglas AGPE?",
    options: [
      "Agencia de Gestión de Proyectos Energéticos",
      "Autogeneración a Pequeña Escala: usuarios que producen energía para su propio consumo con posibilidad de entregar excedentes a la red",
      "Administradora de Grandes Plantas de Energía",
      "Asociación de Generadores con Paneles Estándar",
    ],
    correctIndex: 1,
  },
  {
    id: "q2-11", type: "single",
    question: "¿Cuál es la diferencia técnica entre Energía Activa, Reactiva Inductiva y Reactiva Capacitiva?",
    options: [
      "Energía Activa realiza trabajo útil; Reactiva Inductiva es creada por motores/transformadores para campos magnéticos; Reactiva Capacitiva es generada por bancos de condensadores o cables largos",
      "Energía Activa proviene de fuentes renovables; Reactiva Inductiva se pierde en cables; Reactiva Capacitiva se almacena en baterías",
      "Activa es consumo de día; Inductiva es consumo de noche; Capacitiva es excedente solar",
      "Activa se mide en Voltios; Inductiva en Amperios; Capacitiva en Ohmios",
    ],
    correctIndex: 0,
  },
  {
    id: "q2-12", type: "single",
    question: "¿Cuál es la función principal de la CREG?",
    options: [
      "Construir redes de transmisión",
      "Comisión encargada de regular tarifas, definir fórmulas del Costo Unitario (CU) y dictar normas para promover la competencia entre comercializadores",
      "Organismo que sanciona usuarios que no pagan",
      "Empresa privada que administra la bolsa de energía",
    ],
    correctIndex: 1,
  },
];

// ─── PROGRESS TYPE ───

export interface OnboardingProgress {
  name: string;
  email: string;
  completedVideos: string[];
  day1Done: boolean;
  day2Done: boolean;
  day3Done: boolean;
  quiz1Attempts: number[];
  quiz1BestScore: number;
  quiz1Passed: boolean;
  quiz2Attempts: number[];
  quiz2BestScore: number;
  quiz2Passed: boolean;
  finalAverageScore: number;
  certificateUnlocked: boolean;
}

export const DEFAULT_PROGRESS: OnboardingProgress = {
  name: "",
  email: "",
  completedVideos: [],
  day1Done: false,
  day2Done: false,
  day3Done: false,
  quiz1Attempts: [],
  quiz1BestScore: 0,
  quiz1Passed: false,
  quiz2Attempts: [],
  quiz2BestScore: 0,
  quiz2Passed: false,
  finalAverageScore: 0,
  certificateUnlocked: false,
};

/** Get all video IDs for a day */
export function getDayVideoIds(day: OnboardingDay): string[] {
  return day.sections.flatMap(s => s.videos.map(v => v.id));
}

/** Check if a day is complete (all videos marked) */
export function isDayComplete(day: OnboardingDay, completedVideos: string[]): boolean {
  const ids = getDayVideoIds(day);
  return ids.every(id => completedVideos.includes(id));
}

/** Get day progress percentage */
export function getDayProgress(day: OnboardingDay, completedVideos: string[]): number {
  const ids = getDayVideoIds(day);
  if (ids.length === 0) return 0;
  const done = ids.filter(id => completedVideos.includes(id)).length;
  return Math.round((done / ids.length) * 100);
}
