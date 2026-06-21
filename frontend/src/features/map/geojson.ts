import type { Company } from "@stip/shared-types";

export interface CompanyFeatureProperties {
  id: string;
  company_name: string;
  company_type: string;
  country: string | null;
  city: string | null;
  port: string | null;
  website: string | null;
  remarks: string | null;
}

type CompanyGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: CompanyFeatureProperties;
  }>;
};

export function companiesToGeoJSON(companies: Company[]): CompanyGeoJSON {
  return {
    type: "FeatureCollection",
    features: companies
      .filter(
        (company) =>
          company.latitude !== null &&
          company.longitude !== null &&
          Number.isFinite(company.latitude) &&
          Number.isFinite(company.longitude),
      )
      .map((company) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [company.longitude!, company.latitude!],
        },
        properties: {
          id: company.id,
          company_name: company.company_name,
          company_type: company.company_type,
          country: company.country,
          city: company.city,
          port: company.port?.port_name ?? company.port_name,
          website: company.website,
          remarks: company.remarks,
        },
      })),
  };
}

export function companyFromProperties(
  properties: CompanyFeatureProperties,
): Company {
  return {
    id: properties.id,
    company_name: properties.company_name,
    company_type: properties.company_type as Company["company_type"],
    country: properties.country,
    city: properties.city,
    latitude: null,
    longitude: null,
    port_id: null,
    port_name: properties.port,
    port: properties.port
      ? {
          id: "",
          port_name: properties.port,
          country: properties.country,
          city: properties.city,
          latitude: null,
          longitude: null,
          un_locode: null,
          remarks: null,
          created_at: "",
          updated_at: "",
        }
      : null,
    website: properties.website,
    remarks: properties.remarks,
    created_at: "",
    updated_at: "",
  };
}
