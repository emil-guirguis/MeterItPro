/**
 * DTO for batch upload request
 */
export interface BatchUploadRequestDto {
  readings: Array<{
    meter_id: number;
    meter_element_id?: number | null;
    kwh?: number | null;
    mwh?: number | null;
    kvah?: number | null;
    kvah_export?: number | null;
    kva?: number | null;
    phase_kva_a?: number | null;
    phase_kva_b?: number | null;
    phase_kva_c?: number | null;
    amperage?: number | null;
    phase_amperage_a?: number | null;
    phase_amperage_b?: number | null;
    phase_amperage_c?: number | null;
    frequency?: number | null;
    peak_kw?: number | null;
    kw?: number | null;
    power_factor?: number | null;
    pf_a?: number | null;
    pf_b?: number | null;
    pf_c?: number | null;
    phase_kw_a?: number | null;
    phase_kw_b?: number | null;
    phase_kw_c?: number | null;
    kvarh?: number | null;
    reactive_energy_export?: number | null;
    kvar?: number | null;
    phase_kvar_a?: number | null;
    phase_kvar_b?: number | null;
    phase_kvar_c?: number | null;
    voltage_a_b?: number | null;
    voltage_a_n?: number | null;
    voltage_b_c?: number | null;
    voltage_b_n?: number | null;
    voltage_c_a?: number | null;
    voltage_c_n?: number | null;
    voltage_p_n?: number | null;
    voltage_p_p?: number | null;
    total_thdv?: number | null;
    phase_thdv_a?: number | null;
    phase_thdv_b?: number | null;
    phase_thdv_c?: number | null;
  }>;
}
