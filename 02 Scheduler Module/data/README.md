# Replay inputs

- `bdg2_monthly_kwh.csv`, `bdg2_buildings.csv`: derived from the Building Data Genome Project 2 (Miller, C. et al., 2020, *Scientific Data* 7, 368), licensed CC BY 4.0. Hourly electricity summed to months; a month is blank if fewer than 90% of its hours have readings. Source: https://github.com/buds-lab/building-data-genome-project-2
- `pvgis_elmina.json`: PVGIS 5.2, European Commission Joint Research Centre, rooftop PV yield per kWp at the City of Elmina. Source: https://re.jrc.ec.europa.eu/pvg_tools/

Rebuild all three with `python ../build_inputs.py`.
