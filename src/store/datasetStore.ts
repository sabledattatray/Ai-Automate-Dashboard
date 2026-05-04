import { create } from "zustand";

export interface Dataset {
  id: string;
  name: string;
  columns: string[];
  data: any[];
  rowCount?: number;
}

interface DatasetState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  viewingDatasetId: string | null;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  setActiveDataset: (id: string | null) => void;
  setViewingDatasetId: (id: string | null) => void;
  updateDatasetData: (id: string, newData: any[]) => void;
  updateDataset: (id: string, newDataset: Partial<Dataset>) => void;
  setDatasets: (datasets: Dataset[]) => void;
}

export const useDatasetStore = create<DatasetState>((set) => ({
  datasets: [],
  activeDatasetId: null,
  viewingDatasetId: null,
  addDataset: (dataset) => set((state) => ({ 
    datasets: [...state.datasets, dataset],
    activeDatasetId: dataset.id 
  })),
  removeDataset: (id) => set((state) => ({ 
    datasets: state.datasets.filter(d => d.id !== id),
    activeDatasetId: state.activeDatasetId === id ? null : state.activeDatasetId,
    viewingDatasetId: state.viewingDatasetId === id ? null : state.viewingDatasetId
  })),
  setActiveDataset: (id) => set({ activeDatasetId: id }),
  setViewingDatasetId: (id) => set({ viewingDatasetId: id }),
  updateDatasetData: (id, newData) => set((state) => ({
    datasets: state.datasets.map(d => d.id === id ? { ...d, data: newData } : d)
  })),
  updateDataset: (id, newDataset) => set((state) => ({
    datasets: state.datasets.map(d => d.id === id ? { ...d, ...newDataset } : d)
  })),
  setDatasets: (datasets) => set({ datasets })
}));
