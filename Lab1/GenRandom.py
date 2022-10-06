#!/bin/env python

from BinFile import BinFile
import random

if __name__ == "__main__":
	binf = BinFile("numbers", "w+b")
	if(not binf.ok):
		print("Не вдалося відкрити файл")
		exit()
	amount = int(input("Створити файл зі скількома випадковими числами?\n"))
	full = amount//4096
	for i in range(full):
		binf.setInts32(i*4096, [random.randint(0, 10000) for i in range(4096)])
	for i in range(full*4096, amount):
		binf.setInt32(i, random.randint(0, 10000))
	print("Готово")

