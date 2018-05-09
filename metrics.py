import pandas as pd
import numpy as np
import re
import os


class Metrics:

    def __init__(self, filename):
        filepath = os.path.join(os.path.dirname(__file__), 'uploads/' + filename)
        self.__data_frame = pd.read_table(filepath)
        pattern = re.compile("AOI\[.*\]Hit")

        self.__aoi_list = []
        for col in self.__data_frame.columns:
            if pattern.match(col):
                self.__aoi_list.append(col)

    def getParticipantsList(self):
        if 'ParticipantName' not in self.__data_frame.columns:
            return sorted(self.__data_frame['[ID]Value'].unique())
        else:
            return sorted(self.__data_frame['ParticipantName'].unique())

    def get_aois_list(self):
        return sorted([col[4:-4] for col in self.__aoi_list])

    def get_transitions(self,participant, aois, max, min):
        prev = None
        df = self.__data_frame

        if 'ParticipantName' not in self.__data_frame.columns:
            participant_data = df[df['[ID]Value'] == participant]
        else:
            participant_data = df[df['ParticipantName'].astype('str') == participant]

        df_aois = participant_data[aois]
        dimension = len(aois)
        matrix = np.zeros((dimension,dimension), dtype=int)

        for index, row in df_aois.iterrows():
            for curr in range(len(row)):
                if row[curr] != 1:
                    continue
                if prev is None:
                    prev = curr
                if curr != prev:
                    matrix[prev][curr] += 1
                    prev = curr

        for idy, row in enumerate(matrix):
            for idx, item in enumerate(row):
                if min != '' and item < int(min):
                    matrix[idy][idx] = 0
                if max != '' and item > int(max):
                    matrix[idy][idx] = 0
        return matrix

    def filter_transitions(self, participants, min, max, aois):
        participants_list = []
        dimension = len(aois)
        matrix = np.zeros((dimension, dimension), dtype=int)
        aois = ['AOI[{}]Hit'.format(aoi) for aoi in aois]

        for participant in participants:
            transitions = self.get_transitions(participant, aois, max, min)
            all_ones = transitions.any()
            if all_ones:
                participants_list.append(participant)
                matrix = matrix + transitions

        return {'participants_list': participants_list, 'transitions': matrix}

    # Get information about all
    def get_stats(self, participants, aois):
        stats = []
        participants_data = None
        df = self.__data_frame

        if 'ParticipantName' not in self.__data_frame.columns:
            participants_data = df[df['[ID]Value'].isin(participants)]
        else:
            participants_data = df[df['ParticipantName'].isin(participants)]

        aois = ['AOI[{}]Hit'.format(aoi) for aoi in aois]

        for aoi in aois:
            temp = participants_data[(participants_data[aoi] == 1)]
            sum = temp['GazeEventDuration'].sum()
            count = len(temp.index)
            values = {'label': aoi[4:-4], 'fix_count': count, 'fix_time': int(sum)}
            stats.append(values)
        return stats
