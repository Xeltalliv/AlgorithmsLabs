#!/bin/env python

from BinFile import BinFile
import random
import math
import time

cacheSize = -1

class Run:
	def __init__(self, start, length, binFile):
		self.start = start
		self.length = length
		self.pos = 0
		self.binFile = binFile

	def prepare(self):
		if self.length > 0:
			self.hasMore = True
			self.cache = self.binFile.getInts32(self.start, min(cacheSize, self.length))
			self.cachePos = 0
			self.value = self.cache[0]
		else:
			self.hasMore = False
			self.cache = []
			self.cachePos = 0
			self.value = 0

	def next(self):
		self.pos += 1
		self.cachePos += 1
		if(self.pos < self.length):
			if(self.cachePos >= cacheSize):
				self.cache = self.binFile.getInts32(self.start + self.pos, min(cacheSize, self.length))
				self.cachePos = 0
			#print(str(len(self.cache))+" "+str(self.cachePos)+" "+str(self.pos)+" "+str(self.length))
			self.value = self.cache[self.cachePos]
			return self.value
		else:
			self.hasMore = False
			return 0

def sort(fileCount, runSize, visualize):

	binf = BinFile("numbers", "r+b")
	startTime = time.time()

	# Створення файлів

	inputFiles = []
	inputFileRuns = []
	outputFile = BinFile("workingFile0", "w+b")
	outputFileRuns = []
	for i in range(1, fileCount):
		inputFiles.append(BinFile("workingFile"+str(i), "w+b"))
		inputFileRuns.append([])
	print("Створено "+str(fileCount)+" тимчасових файлів.")
	print("-"*60)


	# Розрахунок розподілу

	distributions = [1] * len(inputFiles)
	currentSize = len(inputFiles)
	targetSize = math.ceil(binf.size / runSize)
	totalSwitches = 0
	while currentSize < targetSize:
		print(distributions)
		totalSwitches += 1
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
	print("Пустих серій: "+str(currentSize - targetSize))
	print("-"*60)
	totalRuns = currentSize


	# Розбиття вхідного файлу в серії та розкладання їх по файлам

	writeFilePos = [0] * len(inputFiles)
	writeToFiles = [x for x in range(len(inputFiles))]
	distr = [distributions[x] for x in range(len(inputFiles))]
	writeToFile = 0
	writeToFileIdx = 0
	readPos = 0
	runsWrittenSoFar = 0
	for i in range(currentSize - targetSize):
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

	while readPos < binf.size:
		ints = binf.getInts32(readPos, runSize)
		ints.sort()
		inputFiles[writeToFile].setInts32(writeFilePos[writeToFile], ints)
		inputFileRuns[writeToFile].append(Run(writeFilePos[writeToFile], len(ints), inputFiles[writeToFile]))
		if(visualize):
			print("запис "+str(len(ints))+" значень в файл "+inputFiles[writeToFile].name+" "+str(distr))
		distr[writeToFileIdx] -= 1
		if(distr[writeToFileIdx] < 1):
			writeToFiles.pop(writeToFileIdx)
			distr.pop(writeToFileIdx)
			writeToFileIdx -= 1

		readPos += runSize
		writeFilePos[writeToFile] += runSize
		if(len(writeToFiles) > 0):
			writeToFileIdx = (writeToFileIdx + 1) % len(writeToFiles)
			writeToFile = writeToFiles[writeToFileIdx]
		runsWrittenSoFar += 1

	print("Початок злиття")

	# Злиття
	keepGoing = True
	outputPos = 0
	switches = 0
	while keepGoing:
		hasMore = True
		outputStart = outputPos
		cache = []
		cachePos = outputPos


		files = []
		values = []
		for i in range(len(inputFiles)):
			if(len(inputFileRuns[i]) > 0):
				inputFileRuns[i][0].prepare()
				if(inputFileRuns[i][0].hasMore):
					files.append(inputFileRuns[i][0])
					values.append(inputFileRuns[i][0].value)

		while(len(values) > 1):
			minVal = min(values)
			minI = values.index(minVal)
			cache.append(minVal)
			if(len(cache) == cacheSize):
				outputFile.setInts32(cachePos, cache)
				cache = []
				cachePos = cachePos + cacheSize

			run = files[minI]
			run.pos += 1
			run.cachePos += 1
			if(run.pos < run.length):
				if(run.cachePos >= cacheSize):
					run.cache = run.binFile.getInts32(run.start + run.pos, min(cacheSize, run.length - run.pos))
					run.cachePos = 0
				values[minI] = run.value = run.cache[run.cachePos]
			else:
				values.pop(minI)
				files.pop(minI)

		if(len(cache) > 0):
			outputFile.setInts32(cachePos, cache)
			cachePos += len(cache)

		if(len(values) == 1):
			run = files[0]
			run.pos += 1
			while(run.length - run.pos > 0):
				ints = run.binFile.getInts32(run.start + run.pos, min(cacheSize, run.length - run.pos))
				run.pos += cacheSize
				outputFile.setInts32(cachePos, ints)
				cachePos += len(ints)
		outputPos = cachePos

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
			switches += 1
			print("["+str(switches)+"/"+str(totalSwitches)+"]")
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

	print("Копіювання результату")

	for i in range(outputFileRuns[0].length):
		binf.setInt32(i, outputFile.getInt32(i))
	for inf in inputFiles:
		inf.delete()
	outputFile.delete()

	print("На виконання пійшло "+str(time.time() - startTime)+" секунд")

def main():
	global cacheSize
	fileCount = int(input("Кількість файлів: "))
	runSize = int(input("Кількість чисел в серії: "))
	cacheSize = int(input("Кількість чисел в кеші кожного файлу: "))
	visualize = input("Показувати сортування? (т/н) ")
	visualize = (visualize == "т" or visualize == "y")
	sort(fileCount, runSize, visualize)

if __name__ == "__main__":
	main()
