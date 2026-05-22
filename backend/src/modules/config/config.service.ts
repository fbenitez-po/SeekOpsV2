import * as repo from './config.repository';

export const teams = () => repo.getTeams();
export const areas = () => repo.getAreas();
export const profiles = () => repo.getProfiles();
export const clientSegmentations = () => repo.getClientSegmentations();
export const clientSectors = () => repo.getClientSectors();
export const projectSegmentations = () => repo.getProjectSegmentations();
export const projectCategories = () => repo.getProjectCategories();
export const productivityLayers = () => repo.getProductivityLayers();
export const serviceTypes = () => repo.getServiceTypes();
export const workCategories = () => repo.getWorkCategories();
