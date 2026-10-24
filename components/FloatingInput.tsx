'use client';
import { type InputHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react';
type InputProps = { label: string; textarea?: false } & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = { label: string; textarea: true } & TextareaHTMLAttributes<HTMLTextAreaElement>;
type Props = InputProps | TextareaProps;

export default function FloatingInput(props: Props) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const fieldClass = 'contact-field-control';
  return <div className="contact-field">
    {props.textarea ? (() => {
      const { label, textarea, className, ...attributes } = props;
      return <textarea {...attributes} id={id} placeholder=" " rows={props.rows ?? 5} className={`${fieldClass} ${className || ''}`} />;
    })() : (() => {
      const { label, textarea, className, ...attributes } = props;
      return <input {...attributes} id={id} type={props.type || 'text'} placeholder=" " className={`${fieldClass} ${className || ''}`} />;
    })()}
    <label htmlFor={id}>{props.label}</label>
  </div>;
}
