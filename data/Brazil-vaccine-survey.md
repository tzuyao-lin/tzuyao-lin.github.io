# Brazilian vaccine-attitude survey: data availability and privacy

The participant-level survey dataset used for this analysis is restricted and is not distributed with this public website repository.

The original working file contained direct or highly identifying fields, including network identifiers, precise timestamps, unique response identifiers, and free-text responses. Removing only those fields would not be sufficient to guarantee anonymity because combinations of demographic, professional, health, and attitude variables may still allow individuals to be singled out or linked to other information.

For local reproduction by an authorised researcher, store the dataset outside the repository and provide its path through the `BRAZIL_DATA_PATH` environment variable. The analysis rejects paths inside the website project. Do not copy or commit the participant-level file anywhere in this repository.

Only variables required by the published analysis are selected after loading. Public outputs should contain aggregate statistics and model results rather than participant-level records.
