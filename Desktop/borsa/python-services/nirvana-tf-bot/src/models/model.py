import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def build_model(n_features=10, seq_len=128):
    inputs = keras.Input(shape=(seq_len, n_features))
    x = layers.Conv1D(32, 3, activation='relu')(inputs)
    x = layers.Bidirectional(layers.LSTM(32))(x)
    x = layers.Dense(32, activation='relu')(x)
    outputs = layers.Dense(1)(x)
    model = keras.Model(inputs, outputs)
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model
