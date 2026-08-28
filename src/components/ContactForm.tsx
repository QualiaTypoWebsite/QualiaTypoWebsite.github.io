/**
 * The contact form.
 *
 * Nothing is sent from this website. Submitting builds a mailto: link and
 * hands it to the visitor's own email program, pre-filled — so no third-party
 * form service ever sees the message. That was a deliberate choice by the site
 * owner.
 *
 * Because mailto: silently fails for people using webmail without a desktop
 * mail client, the address is also printed underneath as plain, copyable text.
 *
 * Validation and the link itself live in mailto.ts.
 */
import { useId, useState } from 'react';
import styles from './ContactForm.module.css';
import { Button } from './Button';
import { buildMailto, CONTACT_EMAIL, validate, type ContactFields, type FieldErrors } from './mailto';
import { useLang } from '../i18n/LanguageProvider';

const EMPTY: ContactFields = { name: '', email: '', subject: '', message: '' };

export function ContactForm() {
  const { t } = useLang();
  const id = useId();
  const [fields, setFields] = useState<ContactFields>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  const set = (key: keyof ContactFields) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFields((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Hands off to the visitor's own mail client — nothing is sent from here,
    // and nothing about the message leaves the browser.
    window.location.href = buildMailto(fields);
    setSent(true);
  };

  const field = (
    key: 'name' | 'email' | 'subject' | 'message',
    type: 'text' | 'email' | 'textarea',
    required = true,
  ) => {
    const fieldId = `${id}-${key}`;
    const errorId = `${fieldId}-error`;
    const invalid = key !== 'subject' && Boolean(errors[key as keyof FieldErrors]);
    const Tag = type === 'textarea' ? 'textarea' : 'input';

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={fieldId}>
          {t(`contact.${key}`)}
        </label>
        <Tag
          id={fieldId}
          className={`${type === 'textarea' ? styles.textarea : styles.input} ${
            invalid ? styles.invalid : ''
          }`}
          {...(type === 'textarea' ? {} : { type })}
          value={fields[key]}
          onChange={set(key)}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          autoComplete={key === 'email' ? 'email' : key === 'name' ? 'name' : 'off'}
        />
        {invalid && (
          <span className={styles.error} id={errorId}>
            {t(`contact.errors.${key}`)}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* noValidate: the messages below are translated, the browser's are not. */}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.row}>
          {field('name', 'text')}
          {field('email', 'email')}
        </div>
        {field('subject', 'text', false)}
        {field('message', 'textarea')}

        <div className={styles.actions}>
          <Button type="submit">{t('contact.send')}</Button>
          <span className={styles.status} role="status">
            {sent ? t('contact.opening') : ''}
          </span>
        </div>
      </form>

      <p className={styles.direct}>
        {t('contact.orWrite')}{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
