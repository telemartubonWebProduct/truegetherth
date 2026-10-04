"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

import { trackEvent } from "@/lib/analytics/tags";
import { submitLead, type LeadFormState } from "@/lib/leads/actions";
import {
  fieldErrors,
  formValues,
  HONEYPOT_FIELD,
  leadFields,
  leadInput,
  leadServices,
  preferredTimes,
  type LeadField,
  type LeadFieldError,
  type LeadService,
} from "@/lib/leads/form";
import type { LeadFormCopy } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";

import type { Bound, Localized } from "./lead-text";

export type LeadFormProps = {
  text: Localized<LeadFormCopy>;
  binds?: Bound<LeadFormCopy>;
  locale: Locale;
  provinces: { code: string; name: string }[];
  /** Packages a request may name (from ?package= on the page's address). */
  packages: Record<string, { name: string; service: LeadService }>;
  policyHref: string;
  /** "preview" in the Mirror editor: everything shows, nothing sends. */
  mode: "live" | "preview";
  /** Stable id for analytics. */
  formId: string;
};

type Errors = Partial<Record<LeadField, LeadFieldError>>;

function newKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const noSubscription = () => () => undefined;

/** The call-back request form (M5); "send another" starts a fresh form. */
export function LeadForm(props: LeadFormProps) {
  const [round, setRound] = useState(0);
  return <LeadFormRound key={round} {...props} onAnother={() => setRound((value) => value + 1)} />;
}

function LeadFormRound({ text, binds, locale, provinces, packages, policyHref, mode, formId, onAnother }: LeadFormProps & { onAnother: () => void }) {
  const id = useId();
  const [state, dispatch, pending] = useActionState<LeadFormState, FormData>(submitLead, null);
  const [clientErrors, setClientErrors] = useState<Errors | null>(null);
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    // A new answer from the server replaces what the browser found.
    setSeenState(state);
    setClientErrors(null);
  }
  const errors: Errors = clientErrors ?? (state?.status === "invalid" ? state.fields : {});

  // The package the visitor came from (a package page's "ask us to call you back").
  const linkedPackage = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(location.search).get("package") ?? "",
    () => "",
  );
  const [packageRemoved, setPackageRemoved] = useState(false);
  const previewPackage = mode === "preview" ? Object.keys(packages)[0] : undefined;
  const packageId = packageRemoved ? "" : packages[linkedPackage] ? linkedPackage : (previewPackage ?? "");
  const [serviceChoice, setServiceChoice] = useState<LeadService | null>(null);
  const service = serviceChoice ?? (packageId ? packages[packageId].service : null);

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const keyRef = useRef("");
  const started = useRef(false);
  const submitted = useRef<{ service?: string; packageId?: string }>({});
  const reported = useRef<LeadFormState>(null);

  useEffect(() => {
    if (state?.status === "sent") {
      successRef.current?.focus();
      // generate_lead only once the request is stored, and not for a repeat.
      if (!state.duplicate && reported.current !== state) {
        reported.current = state;
        trackEvent("generate_lead", { form_id: formId, lead_service: submitted.current.service, package_id: submitted.current.packageId });
      }
    }
    if (state?.status === "invalid") focusFirstInvalid(formRef.current, state.fields);
  }, [state, formId]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode !== "live" || pending) return;
    const data = new FormData(event.currentTarget);
    keyRef.current ||= newKey();
    data.set("idempotencyKey", keyRef.current);
    data.set("source", `${location.pathname}${location.search}`);
    const parsed = leadInput.safeParse(formValues(data));
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error);
      setClientErrors(fields);
      focusFirstInvalid(event.currentTarget, fields);
      return;
    }
    setClientErrors({});
    submitted.current = { service: parsed.data.service, packageId: parsed.data.packageId };
    startTransition(() => dispatch(data));
  };

  const clearError = (field: string) => {
    if (!(field in errors)) return;
    const next = { ...errors };
    delete next[field as LeadField];
    setClientErrors(next);
  };

  if (state?.status === "sent") {
    return (
      <div role="status" className="rounded-tm-panel border border-tm-line bg-tm-canvas p-6 lg:p-8" data-lead-form-sent="">
        <h3 ref={successRef} tabIndex={-1} className="text-tm-h3 font-semibold outline-none" {...binds?.successHeading}>
          {text.successHeading}
        </h3>
        <p className="mt-3 text-tm-lead text-tm-muted" {...binds?.successBody}>
          {text.successBody}
        </p>
        <button type="button" className="tm-button tm-button-secondary mt-6" onClick={onAnother} {...binds?.another}>
          {text.another}
        </button>
      </div>
    );
  }

  const fieldId = (field: string) => `${id}-${field}`;
  const describedBy = (field: LeadField, hint?: boolean) =>
    [hint ? `${fieldId(field)}-hint` : "", errors[field] ? `${fieldId(field)}-error` : ""].filter(Boolean).join(" ") || undefined;
  const errorText = (field: LeadField) => {
    const code = errors[field];
    return code ? (
      <p id={`${fieldId(field)}-error`} className="tm-field-error" {...binds?.errors[code]}>
        {text.errors[code]}
      </p>
    ) : null;
  };
  const optional = (
    <span className="font-normal text-tm-muted" {...binds?.optional}>
      {" "}
      ({text.optional})
    </span>
  );
  const serverProblem = state?.status === "rate_limited" ? "rateLimited" : state?.status === "failed" ? "failed" : state?.status === "unavailable" ? "unavailable" : null;

  return (
    <form
      ref={formRef}
      action={dispatch}
      onSubmit={onSubmit}
      onFocus={() => {
        if (started.current || mode !== "live") return;
        started.current = true;
        trackEvent("lead_form_start", { form_id: formId });
      }}
      onInput={(event) => clearError((event.target as HTMLInputElement).name)}
      noValidate
      className="grid gap-6 rounded-tm-panel border border-tm-line bg-tm-canvas p-5 sm:p-6 lg:p-8"
      data-lead-form={formId}
    >
      <input type="hidden" name="locale" value={locale} />
      {/* Hidden from people and assistive technology; some bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={fieldId("trap")}>Leave this empty</label>
        <input id={fieldId("trap")} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={fieldId("name")} label={text.name} bind={binds?.name}>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={100}
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className="tm-input mt-2"
          />
          {errorText("name")}
        </Field>
        <Field id={fieldId("phone")} label={text.phone} bind={binds?.phone}>
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={20}
            required
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone", true)}
            className="tm-input tm-num mt-2"
          />
          {errorText("phone")}
          <p id={`${fieldId("phone")}-hint`} className="mt-1.5 text-tm-small text-tm-muted" {...binds?.phoneHint}>
            {text.phoneHint}
          </p>
        </Field>
        <Field id={fieldId("province")} label={text.province} bind={binds?.province}>
          <select
            id={fieldId("province")}
            name="province"
            required
            defaultValue=""
            autoComplete="address-level1"
            aria-invalid={errors.province ? true : undefined}
            aria-describedby={describedBy("province")}
            className="tm-input mt-2"
          >
            <option value="" disabled {...binds?.provincePlaceholder}>
              {text.provincePlaceholder}
            </option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
          {errorText("province")}
        </Field>
        <Field id={fieldId("area")} label={text.area} bind={binds?.area} extra={optional}>
          <input
            id={fieldId("area")}
            name="area"
            type="text"
            autoComplete="address-level2"
            maxLength={120}
            aria-invalid={errors.area ? true : undefined}
            aria-describedby={describedBy("area", true)}
            className="tm-input mt-2"
          />
          {errorText("area")}
          <p id={`${fieldId("area")}-hint`} className="mt-1.5 text-tm-small text-tm-muted" {...binds?.areaHint}>
            {text.areaHint}
          </p>
        </Field>
      </div>

      <fieldset aria-describedby={errors.service ? `${fieldId("service")}-error` : undefined}>
        <legend className="font-semibold" {...binds?.service}>
          {text.service}
        </legend>
        <div className="tm-choice-group mt-2 flex flex-wrap gap-2" aria-invalid={errors.service ? true : undefined} data-field="service">
          {leadServices.map((value) => (
            <label key={value} className="tm-choice" {...binds?.services[value]}>
              <input
                type="radio"
                name="service"
                value={value}
                checked={service === value}
                onChange={() => setServiceChoice(value)}
              />
              {text.services[value]}
            </label>
          ))}
        </div>
        {errorText("service")}
      </fieldset>

      {packageId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-tm-control bg-tm-surface px-4 py-3" data-lead-package={packageId}>
          <p>
            <span className="block text-tm-small text-tm-muted" {...binds?.package}>
              {text.package}
            </span>
            <span className="font-semibold">{packages[packageId].name}</span>
          </p>
          <input type="hidden" name="packageId" value={packageId} />
          <button type="button" className="tm-link min-h-tm-control text-tm-small font-semibold" onClick={() => setPackageRemoved(true)} {...binds?.packageRemove}>
            {text.packageRemove}
          </button>
        </div>
      ) : null}

      <fieldset aria-describedby={errors.preferredTime ? `${fieldId("preferredTime")}-error` : undefined}>
        <legend className="font-semibold" {...binds?.time}>
          {text.time}
        </legend>
        <div className="tm-choice-group mt-2 flex flex-wrap gap-2" aria-invalid={errors.preferredTime ? true : undefined} data-field="preferredTime">
          {preferredTimes.map((value) => (
            <label key={value} className="tm-choice" {...binds?.times[value]}>
              <input type="radio" name="preferredTime" value={value} defaultChecked={value === "anytime"} />
              {text.times[value]}
            </label>
          ))}
        </div>
        {errorText("preferredTime")}
      </fieldset>

      <Field id={fieldId("message")} label={text.message} bind={binds?.message} extra={optional}>
        <textarea
          id={fieldId("message")}
          name="message"
          maxLength={1000}
          rows={3}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message")}
          className="tm-input mt-2"
        />
        {errorText("message")}
      </Field>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            value="yes"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${fieldId("consent")}-error` : undefined}
            className="tm-check"
          />
          <span>
            <span {...binds?.consent}>{text.consent}</span>{" "}
            <a href={policyHref} className="tm-link font-medium" {...binds?.policyLink}>
              {text.policyLink}
            </a>
          </span>
        </label>
        {errorText("consent")}
      </div>

      {serverProblem ? (
        <p role="alert" className="rounded-tm-control bg-tm-danger-wash px-4 py-3 font-medium text-tm-danger" {...binds?.errors[serverProblem]}>
          {text.errors[serverProblem]}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="tm-button tm-button-primary w-full sm:w-auto" aria-disabled={pending || undefined} {...binds?.submit}>
          {pending ? text.sending : text.submit}
        </button>
        {mode === "preview" ? (
          <p className="text-tm-small text-tm-muted" {...binds?.errors.preview}>
            {text.errors.preview}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Field({ id, label, bind, extra, children }: { id: string; label: string; bind?: { "data-edit"?: string }; extra?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        <span {...bind}>{label}</span>
        {extra}
      </label>
      {children}
    </div>
  );
}

/** Moves focus to the first field with a problem, in the form's order. */
function focusFirstInvalid(form: HTMLFormElement | null, fields: Errors) {
  const first = leadFields.find((field) => fields[field]);
  if (!form || !first) return;
  const element = form.querySelector<HTMLElement>(`[name="${first}"]`);
  element?.focus();
}
