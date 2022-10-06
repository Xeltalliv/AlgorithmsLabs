import os

class BinFile:
	def __init__(self, name, mode="r+b"):
		try:
			myFile = open(name, mode)
			self.myFile = myFile
			self.name = name
			myFile.seek(0,2)
			self.size = myFile.tell() // 4
			self.ok = True
			self.closed = False
		except IOError:
			self.ok = False

	def getInt32(self, pos):
		self.myFile.seek(pos*4)
		arr = self.myFile.read(4)
		return ((arr[3]*256+arr[2])*256+arr[1])*256+arr[0]

	def getInts32(self, pos, amount):
		self.myFile.seek(pos*4)
		arr = self.myFile.read(amount*4)
		outputs = []
		for i in range(0, len(arr), 4):
			outputs.append(((arr[i+3]*256+arr[i+2])*256+arr[i+1])*256+arr[i])
		return outputs

	def setInt32(self, pos, value):
		self.myFile.seek(pos*4)
		arr = []
		for i in range(4):
			arr.append(value % 256)
			value //= 256
		self.myFile.write(bytearray(arr))
		if(pos+1 > self.size):
			self.size = pos+1

	def setInts32(self, pos, values):
		self.myFile.seek(pos*4)
		arr = []
		for j in range(len(values)):
			value = values[j]
			for i in range(4):
				arr.append(value % 256)
				value //= 256
		self.myFile.write(bytearray(arr))

	def close(self):
		if(not self.closed):
			self.myFile.close()
			self.closed = True

	def delete(self):
		if(not self.closed):
			self.myFile.close()
			self.closed = True
		os.remove(self.name)