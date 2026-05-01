import { Wrench, Building2, ShieldCheck, Zap, GraduationCap, Dna, BarChart3, Settings, Scale, Sun, Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EvalQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Topic {
  title: string;
  videoUrl: string;
}

export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  topics: Topic[];
  evaluationQuestions?: EvalQuestion[];
}

export interface Section {
  id: string;
  title: string;
  modules: AcademyModule[];
}

export interface Program {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  sections: Section[];
}

export const PROGRAMS: Program[] = [
  {
    id: "onboarding",
    title: "Tu Despegue en Bia",
    subtitle: "Domina el ecosistema energético y conviértete en protagonista de la revolución sostenible.",
    icon: GraduationCap,
    sections: [
      {
        id: "dia-1",
        title: "Inmersión y Setup Técnico",
        modules: [
          {
            id: "herramientas",
            title: "Tu Setup Digital",
            description: "Configura las herramientas clave para potenciar tu rendimiento desde el día 1.",
            icon: Wrench,
            topics: [
              { title: "Aquí empieza tu reto", videoUrl: "https://drive.google.com/file/d/1uBNEy0PJwXRgtxBtWzXtbUBH9q7br-2d/preview" },
              { title: "Firma y foto Gmail", videoUrl: "https://drive.google.com/file/d/12QNAHUjAAGmVkOgSRKhOvvN6ujJHEOzX/preview" },
              { title: "Slack", videoUrl: "https://drive.google.com/file/d/1Zgw9DzCLj-kcJ464GdNknFg5SDtfbbc0/preview" },
              { title: "LinkedIn", videoUrl: "https://drive.google.com/file/d/1EqW2QT5hj4C6Xd89Lm0CNt3tIgpueP88/preview" },
              { title: "People Space", videoUrl: "https://drive.google.com/file/d/1idc5NxITYCPSRRI2gQPsVkf4DwFAAxD2/preview" },
              { title: "Fondo de llamada", videoUrl: "https://drive.google.com/file/d/1RAZx4FKCjGijPzVq0L8_vxzTTP3F8cY7/preview" },
            ],
          },
          {
            id: "buk",
            title: "El Mundo Buk",
            description: "Gestiona tu bienestar y balance desde un solo lugar.",
            icon: Building2,
            topics: [
              { title: "Introducción Buk", videoUrl: "https://drive.google.com/file/d/1I7vlmrbpbFHPVvHY0Cd6haRELbleMXh_/preview" },
              { title: "Vacaciones", videoUrl: "https://drive.google.com/file/d/1cTviYkIWaF4DXY2obxm7D3DhgCeN2k3L/preview" },
              { title: "Media día de vacaciones", videoUrl: "https://drive.google.com/file/d/1SgJhqXR1tsWTotXpM_dUFP5hB_yQodVH/preview" },
              { title: "Certificado laboral y nómina", videoUrl: "https://drive.google.com/file/d/1VnhQTqSKYaw63yCFqVei-aRTokXOzI_5/preview" },
              { title: "Día de la familia", videoUrl: "https://drive.google.com/file/d/1h4s75GHK6DwAflkZWJ1_qdNIaRldeZnz/preview" },
              { title: "Incapacidades", videoUrl: "https://drive.google.com/file/d/1aT4Vjbe-yVRrbfRyk8aV9gF7JICL9Xvm/preview" },
              { title: "Licencia de Luto", videoUrl: "https://drive.google.com/file/d/1H_Qone5iSOKBeJSgaLXGvRJNQa6sW7G2/preview" },
            ],
          },
          {
            id: "sst",
            title: "Cultura y Seguridad",
            description: "Cuidamos de ti mientras transformamos el sector.",
            icon: ShieldCheck,
            topics: [
              { title: "Seguridad y salud en el trabajo", videoUrl: "https://drive.google.com/file/d/1f8yE4Nmcirhac9rOQLZfvn6ld9EXCBwa/preview" },
            ],
            evaluationQuestions: [
              { question: "¿Por qué es importante la seguridad y salud en el trabajo en Bia?", options: ["Es un requisito legal y protege el bienestar de los colaboradores", "Solo aplica para trabajo en campo", "Es opcional para empleados nuevos", "No es relevante en empresas de energía"], correctIndex: 0 },
              { question: "¿Cuál es tu responsabilidad principal en temas de seguridad laboral?", options: ["Solo el área de RRHH se encarga", "Reportar riesgos y seguir los protocolos de seguridad", "No aplica en trabajo remoto", "Delegar la responsabilidad al líder"], correctIndex: 1 },
              { question: "¿Qué debes hacer si identificas un riesgo en tu lugar de trabajo?", options: ["Ignorarlo si no te afecta directamente", "Esperar a que alguien más lo reporte", "Reportarlo inmediatamente a tu líder o al área de SST", "Resolverlo por tu cuenta sin avisar"], correctIndex: 2 },
            ],
          },
        ],
      },
      {
        id: "dia-2",
        title: "Ecosistema Energético Bia",
        modules: [
          {
            id: "adn",
            title: "Identidad Bia",
            description: "Entiende por qué hacemos lo que hacemos.",
            icon: Dna,
            topics: [
              { title: "ADN y contexto BIA", videoUrl: "https://drive.google.com/file/d/1LlbCbCTq35tdRQkEGKVAJSzWkt7f5mLJ/preview" },
            ],
            evaluationQuestions: [
              { question: "¿Qué representa el ADN de Bia?", options: ["Los productos que vende la empresa", "La cultura, valores y propósito de la organización", "El organigrama de la empresa", "Las políticas de recursos humanos"], correctIndex: 1 },
              { question: "¿Cuál es el principal sector en el que opera Bia?", options: ["Fintech", "Energético", "Salud", "Educación"], correctIndex: 1 },
              { question: "¿Qué valor diferencial promueve Bia en su cultura organizacional?", options: ["La competencia individual", "La innovación y sostenibilidad energética", "La reducción de costos a toda costa", "El crecimiento solo por ventas"], correctIndex: 1 },
            ],
          },
          {
            id: "fundamentos-energia",
            title: "Fundamentos y arquitectura del sistema",
            description: "Fundamentos y arquitectura del sistema que movemos.",
            icon: Zap,
            topics: [
              { title: "Fundamentos y arquitectura del Sector Energético", videoUrl: "https://drive.google.com/drive/folders/1sADAu2uA2yMYkFEIg0nMVfIN483FzJXo" },
            ],
            evaluationQuestions: [
              { question: "¿Cuáles son los principales eslabones de la cadena energética en Colombia?", options: ["Generación, transmisión, distribución y comercialización", "Extracción, refinación y venta", "Producción, almacenamiento y exportación", "Diseño, construcción y mantenimiento"], correctIndex: 0 },
              { question: "¿Qué rol cumple Bia dentro de la cadena energética?", options: ["Generador de energía convencional", "Comercializador y facilitador de energía renovable", "Distribuidor de redes eléctricas", "Regulador del mercado energético"], correctIndex: 1 },
            ],
          },
          {
            id: "estructura-tarifaria",
            title: "Estructura Tarifaria y componentes clave",
            description: "Descifra los números detrás de la energía.",
            icon: BarChart3,
            topics: [
              { title: "Estructura tarifaria y componentes clave", videoUrl: "https://drive.google.com/file/d/12XSCkCTa_ea8cteVNyJ-JHkJOrEOKwZf/preview" },
            ],
            evaluationQuestions: [
              { question: "¿Qué componentes principales conforman la tarifa de energía eléctrica?", options: ["Solo el costo de generación", "Generación, transmisión, distribución, comercialización y pérdidas", "Impuestos y subsidios únicamente", "El precio internacional del petróleo"], correctIndex: 1 },
              { question: "¿Qué es el componente de comercialización en la tarifa?", options: ["El costo de construir redes eléctricas", "El margen que cubre la gestión comercial del servicio de energía", "Un impuesto gubernamental", "El subsidio para estratos bajos"], correctIndex: 1 },
            ],
          },
          {
            id: "operaciones",
            title: "Operadores de Red",
            description: "Comercializadores y operadores: los actores del mercado.",
            icon: Settings,
            topics: [
              { title: "Operadores de red y comercializadores", videoUrl: "https://drive.google.com/file/d/1Cb4FMGba6yms2OnT5v2fE2LHRV8z0ftN/preview" },
            ],
            evaluationQuestions: [
              { question: "¿Qué son los operadores de red?", options: ["Empresas de telecomunicaciones", "Entidades que gestionan la infraestructura eléctrica de distribución", "Proveedores de internet", "Reguladores gubernamentales"], correctIndex: 1 },
              { question: "¿Cuál es la diferencia entre un operador de red y un comercializador?", options: ["No hay diferencia, son lo mismo", "El operador gestiona la infraestructura física; el comercializador gestiona la relación comercial con el usuario", "El comercializador construye las redes", "El operador vende energía directamente al consumidor"], correctIndex: 1 },
            ],
          },
        ],
      },
      {
        id: "dia-3",
        title: "Marco Regulatorio y AGPE",
        modules: [
          {
            id: "marco-normativo",
            title: "Marco Normativo y regulatorio",
            description: "Navega la regulación que impulsa el cambio.",
            icon: Scale,
            topics: [
              { title: "Sesión de Marco Normativo", videoUrl: "https://drive.google.com/drive/folders/1sADAu2uA2yMYkFEIg0nMVfIN483FzJXo" },
            ],
            evaluationQuestions: [
              { question: "¿Cuál es la entidad principal que regula el sector eléctrico en Colombia?", options: ["El Ministerio de Transporte", "La CREG (Comisión de Regulación de Energía y Gas)", "La DIAN", "El Banco de la República"], correctIndex: 1 },
              { question: "¿Qué ley marco regula los servicios públicos domiciliarios en Colombia?", options: ["Ley 100 de 1993", "Ley 142 de 1994", "Ley 1801 de 2016", "Ley 80 de 1993"], correctIndex: 1 },
              { question: "¿Qué rol cumple la Superintendencia de Servicios Públicos Domiciliarios?", options: ["Generar energía para el país", "Vigilar y controlar la prestación de servicios públicos", "Construir infraestructura eléctrica", "Fijar el precio internacional de la energía"], correctIndex: 1 },
            ],
          },
          {
            id: "agpe",
            title: "Autogeneración a Pequeña Escala (AGPE)",
            description: "Autogeneración: el futuro de la energía distribuida.",
            icon: Sun,
            topics: [
              { title: "Sesión AGPE", videoUrl: "https://drive.google.com/drive/folders/1sADAu2uA2yMYkFEIg0nMVfIN483FzJXo" },
            ],
            evaluationQuestions: [
              { question: "¿Qué significa AGPE?", options: ["Asociación General de Productores Eléctricos", "Autogeneración a Pequeña Escala", "Acuerdo General de Precios Energéticos", "Auditoría General de Proyectos Eléctricos"], correctIndex: 1 },
              { question: "¿Cuál es el límite de capacidad instalada para ser considerado AGPE en Colombia?", options: ["Hasta 5 MW", "Hasta 1 MW", "Hasta 10 MW", "No existe límite"], correctIndex: 1 },
              { question: "¿Qué beneficio principal obtiene un usuario AGPE?", options: ["Energía gratis de por vida", "Créditos de energía por excedentes entregados a la red", "Exención total de impuestos", "Subsidio gubernamental mensual"], correctIndex: 1 },
            ],
          },
        ],
      },
      {
        id: "dia-4",
        title: "Sostenibilidad y Certificados",
        modules: [
          {
            id: "rec",
            title: "Certificados de Energía Renovable (REC)",
            description: "Trazando la ruta de la energía 100% limpia.",
            icon: Leaf,
            topics: [
              { title: "Sesión Certificados REC", videoUrl: "https://drive.google.com/drive/folders/1sADAu2uA2yMYkFEIg0nMVfIN483FzJXo" },
            ],
            evaluationQuestions: [
              { question: "¿Qué son los certificados REC?", options: ["Reportes de Energía Consumida", "Certificados que acreditan la generación de 1 MWh de energía renovable", "Recibos de pago de energía", "Registros de Emisiones de Carbono"], correctIndex: 1 },
              { question: "¿Para qué sirve un certificado REC a una empresa?", options: ["Para pagar menos impuestos", "Para demostrar y acreditar el consumo de energía limpia en sus reportes de sostenibilidad", "Para obtener descuentos en la factura de energía", "Para exportar energía a otros países"], correctIndex: 1 },
              { question: "¿Quién emite los certificados REC en Colombia?", options: ["El Ministerio de Hacienda", "Un organismo de certificación acreditado como I-REC", "Las empresas de energía convencional", "Los usuarios finales"], correctIndex: 1 },
            ],
          },
        ],
      },
    ],
  },
];
