import type { SVGProps } from "react";

/**
 * A collection of SVG icons used throughout the application.
 * This object centralizes icon definitions for easy reuse.
 */
export const Icons = {
  /**
   * The main logo for the application, a stylized "Collaborative Circle".
   * @param {SVGProps<SVGSVGElement>} props - Standard SVG props.
   * @returns {JSX.Element} The logo SVG component.
   */
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
      <path d="M12 10.5C11.1716 10.5 10.5 11.1716 10.5 12C10.5 12.8284 11.1716 13.5 12 13.5C12.8284 13.5 13.5 12.8284 13.5 12C13.5 11.1716 12.8284 10.5 12 10.5Z" />
      <path d="M6.34298 7.34298L7.05009 6.63587L8.41405 8.00003L10.0481 4.58579L11.414 5.95175L9.41405 9.00003L6.34298 7.34298Z" />
      <path d="M4.58579 10.0481L5.95175 11.414L9.00003 9.41405L7.34298 6.34298L6.63587 7.05009L8.00003 8.41405L4.58579 10.0481Z" />
      <path d="M7.34298 17.657L6.63587 16.9499L8.00003 15.5859L4.58579 13.9519L5.95175 12.586L9.00003 14.5859L7.34298 17.657Z" />
      <path d="M13.9519 4.58579L12.586 5.95175L14.5859 9.00003L17.657 7.34298L16.9499 6.63587L15.5859 8.00003L13.9519 4.58579Z" />
      <path d="M10.0481 19.4142L11.414 18.0483L9.41405 15L6.34298 16.657L7.05009 17.3641L8.41405 15.9999L10.0481 19.4142Z" />
      <path d="M17.657 16.657L16.657 17.657L15 15.9999L12.586 18.0483L13.9519 19.4142L15.9999 15.9999L17.3641 17.3641L17.657 16.657Z" />
      <path d="M19.4142 13.9519L18.0483 12.586L15 14.5859L16.657 17.657L17.3641 16.9499L15.9999 15.5859L19.4142 13.9519Z" />
      <path d="M15 9.41405L18.0483 11.414L19.4142 10.0481L15.9999 8.41405L17.3641 7.05009L16.657 6.34298L15 9.41405Z" />
    </svg>
  ),
};
