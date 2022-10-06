#!/bin/env python

from BinFile import BinFile
import random
import math
import time

class Run:
	def __init__(self, start, length, binFile):
		self.start = start
		self.length = length
		self.pos = 0
		self.binFile = binFile
		if length > 0:
			self.hasMore = True
			self.value = binFile.getInt32(start)
		else:
			self.hasMore = False
			self.value = 0

	def next(self):
		self.pos += 1
		if(self.pos < self.length):
			self.value = self.binFile.getInt32(self.start + self.pos)
		else:
			self.hasMore = False

def sort(fileCount, visualize):
	startTime = time.time()

	binf = BinFile("numbers", "r+b")

	# Створення файлів

	inputFiles = []
	inputFileRuns = []
	outputFile = BinFile("workingFile0", "w+b")
	outputFileRuns = []
	for i in range(1, fileCount):
		inputFiles.append(BinFile("workingFile"+str(i), "w+b"))
		inputFileRuns.append([])
	print("Created "+str(fileCount)+" temporary files.\n")


	# Розрахунок розподілу

	distributions = [1] * len(inputFiles)
	currentSize = len(inputFiles)
	targetSize = binf.size
	while currentSize < targetSize:
		print(distributions)
		maxVal = -1
		maxI = 0
		for i in range(len(distributions)): # Знайти найбільше
			if(distributions[i] > maxVal):
				maxVal = distributions[i]
				maxI = i
		for i in range(len(distributions)): # Додати до всіх інших
			if(i != maxI):
				distributions[i] += maxVal
				currentSize += maxVal
	print("-"*60)
	print("Розподіл: "+str(distributions))
	print("Всього серій: "+str(currentSize))
	print("Справжніх серій: "+str(targetSize))
	print("Пустих серій: "+str(currentSize - targetSize)+"\n")
	totalRuns = currentSize


	# Розбиття вхідного файлу в серії та розкладання їх по файлам

	writeFilePos = [0] * len(inputFiles)
	writeToFiles = [x for x in range(len(inputFiles))]
	distr = [distributions[x] for x in range(len(inputFiles))]
	writeToFile = 0
	writeToFileIdx = 0
	readPos = 0
	runsWrittenSoFar = 0
	while readPos < binf.size:
		ints = binf.getInt32(readPos)
		inputFiles[writeToFile].setInt32(writeFilePos[writeToFile], ints)
		inputFileRuns[writeToFile].append(Run(writeFilePos[writeToFile], 1, inputFiles[writeToFile]))
		if(visualize):
			print("запис "+str(len(ints))+" значень в файл "+inputFiles[writeToFile].name+" "+str(distr))
		distr[writeToFileIdx] -= 1
		if(distr[writeToFileIdx] < 1):
			writeToFiles.pop(writeToFileIdx)
			distr.pop(writeToFileIdx)
			writeToFileIdx -= 1

		readPos += 1
		writeFilePos[writeToFile] += 1
		writeToFileIdx = (writeToFileIdx + 1) % len(writeToFiles)
		writeToFile = writeToFiles[writeToFileIdx]
		runsWrittenSoFar += 1

	while runsWrittenSoFar < totalRuns:
		inputFileRuns[writeToFile].append(Run(writeFilePos[writeToFile], 0, inputFiles[writeToFile]))
		if(visualize):
			print("запис пустої серії в файл "+inputFiles[writeToFile].name+" "+str(distr))
		distr[writeToFileIdx] -= 1
		if(distr[writeToFileIdx] < 1):
			writeToFiles.pop(writeToFileIdx)
			distr.pop(writeToFileIdx)
			writeToFileIdx -= 1


		if(len(writeToFiles) > 0): # Запобігти вилітам від %0 та читання поза межами
			writeToFileIdx = (writeToFileIdx + 1) % len(writeToFiles)
			writeToFile = writeToFiles[writeToFileIdx]
		runsWrittenSoFar += 1


	# Злиття
	keepGoing = True
	outputPos = 0
	while keepGoing:
		hasMore = True
		outputStart = outputPos
		while hasMore:
			minI = -1
			minVal = 9999999
			for i in range(len(inputFiles)):
				if(len(inputFileRuns[i]) > 0 and inputFileRuns[i][0].hasMore):
					value = inputFileRuns[i][0].value
					#print(" Перевіряємо значення: "+str(value))
					if(value < minVal):
						minVal = value
						minI = i
			if(minI > -1):
				#print("Мінімум: "+str(minVal))
				outputFile.setInt32(outputPos, minVal)
				outputPos += 1
				inputFileRuns[minI][0].next()
				hasMore = True
			else:
				hasMore = False
		#print("Немає нічого")
		outputLength = outputPos - outputStart
		outputFileRuns.append(Run(outputStart, outputLength, outputFile))
		switchTo = -1
		switchToCount = 0
		for i in range(len(inputFiles)):
			if(len(inputFileRuns[i]) > 0):
				inputFileRuns[i].pop(0)
				if(len(inputFileRuns[i]) == 0):
					switchTo = i
					switchToCount += 1

		if(switchToCount == len(inputFiles)): # Всі файли пусті - вийти
			keepGoing = False
		elif(switchTo > -1): # Один з файлів пустий - переключитись на нього
			if(visualize):
				print("В файлі "+inputFiles[switchTo].name+" скінчилися серії. Робимо його вихідним")
			outputFile, inputFiles[switchTo] = inputFiles[switchTo], outputFile
			outputFileRuns, inputFileRuns[switchTo] = inputFileRuns[switchTo], outputFileRuns
			outputPos = 0

		if(visualize):
			print("Розподіл серій:")
			for i in range(len(inputFileRuns)):
				print(" "+inputFiles[i].name+"> "+("="*len(inputFileRuns[i])))
			print(" "+outputFile.name+"< "+("="*len(outputFileRuns)))


	for i in range(outputFileRuns[0].length):
		binf.setInt32(i, outputFile.getInt32(i))
	for inf in inputFiles:
		inf.delete()
	outputFile.delete()

	print("На виконання пійшло "+str(time.time() - startTime)+" секунд")

def main():
	fileCount = int(input("Кількість файлів: "))
	visualize = (input("Показувати сортування? (т/н) ") == "т")
	sort(fileCount, visualize)

if __name__ == "__main__":
	main()
