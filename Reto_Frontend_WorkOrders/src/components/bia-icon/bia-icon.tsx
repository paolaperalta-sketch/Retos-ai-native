import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as regularFontAwesomeIcons from '@fortawesome/pro-regular-svg-icons';
import * as solidFontAwesomeIcons from '@fortawesome/pro-solid-svg-icons';
import './bia-icon.module.scss';

/**
 * Props para el componente BiaIcon.
 *
 * Este componente permite el uso de íconos provenientes de dos librerías de FontAwesome
 * (regular y solid), así como de un set de íconos personalizados (biaicon).
 *
 * Adicionalmente, el componente admite variantes de color y tamaño que pueden ser
 * aplicadas a los íconos de manera dinámica.
 */
export interface IconProps {
  /**
   * ID del ícono.
   *
   * @example 'icon-1' para un ícono con un ID específico.
   */
  id?: string;

  /**
   * Nombre del ícono que se va a renderizar.
   *
   * - Para los íconos de FontAwesome (regular y solid), debe coincidir con uno de los nombres
   *   de los íconos importados (como 'faSignOutAlt').
   * - Para los íconos personalizados (biaicon), debe coincidir con el nombre definido en el set
   *   de íconos personalizados.
   *
   * @example 'faSignOutAlt' para FontAwesome
   * @example 'visa' para un ícono personalizado
   */
  iconName: keyof typeof regularFontAwesomeIcons | keyof typeof solidFontAwesomeIcons | string;

  /**
   * Tipo de ícono que se va a renderizar.
   *
   * - 'regular': Utiliza íconos regulares de FontAwesome.
   * - 'solid': Utiliza íconos sólidos de FontAwesome.
   * - 'biaicon': Utiliza íconos personalizados definidos en el set de íconos (IcoMoon, etc.).
   *
   * @example 'regular' para íconos regulares.
   * @example 'solid' para íconos sólidos.
   * @example 'biaicon' para íconos personalizados.
   */
  iconType: 'regular' | 'solid';

  /**
   * Color del ícono, puede ser un string con cualquier valor CSS válido.
   *
   * @default 'var(--ink-strong)'
   *
   * @example '#08080a' para un color rojo personalizado.
   * @example 'var(--ink-accent)' para usar una variable CSS del tema.
   * @example 'rgb(0, 8, 8)' para un color RGB.
   */
  color?: string;

  /**
   * Tamaño del ícono, aceptando cualquier valor válido en CSS para `font-size`.
   *
   * Puede ser una unidad de medida CSS como píxeles (px), em, rem, etc.
   *
   * @default '1em'
   *
   * @example '16px' para un ícono de 16 píxeles.
   * @example '2rem' para un ícono de 2 rem.
   */
  size?: string;

  /**
   * Clase CSS adicional que se puede agregar para estilos personalizados.
   *
   * Se utiliza para agregar estilos adicionales o sobrescribir los predeterminados.
   *
   * @example 'custom-class' para aplicar estilos personalizados desde tu hoja de estilos.
   */
  className?: string;
}

export const BiaIcon = ({
  id,
  iconName,
  iconType,
  className,
  color,
  size = '1em',
}: IconProps) => {
  let selectedIcon: IconDefinition | undefined;

  // Usar el color proporcionado o el valor por defecto
  const iconColor = color || '#08080a';

  // Definir estilos dinámicos
  const iconStyles = {
    color: iconColor,
    fontSize: size,
  };

  switch (iconType) {
    case 'regular':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedIcon = (regularFontAwesomeIcons as any)[iconName] as IconDefinition;
      break;
    case 'solid':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedIcon = (solidFontAwesomeIcons as any)[iconName] as IconDefinition;
      break;
  }

  if (!selectedIcon) {
    return null;
  }

  return (
    <FontAwesomeIcon
      id={id}
      data-testid={`${id}-icon`}
      icon={selectedIcon}
      className={className}
      style={iconStyles}
      color={iconColor}
    />
  );
};
