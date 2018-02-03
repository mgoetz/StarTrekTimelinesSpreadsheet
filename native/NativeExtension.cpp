#include "NativeExtension.h"
#include "VoyageCalculator.h"

using v8::FunctionTemplate;

NAN_METHOD(calculateVoyageRecommendations)
{
  //v8::Local<v8::Function> callbackHandle = info[0].As<v8::Function>();
  //Nan::MakeCallback(Nan::GetCurrentContext()->Global(), callbackHandle, 0, 0);

  //std::ifstream fileContents("voyageRecommendations.json");

  //std::cout << std::thread::hardware_concurrency() << " concurrent threads are supported.\n";

  auto calc = std::make_unique<VoyageTools::VoyageCalculator>(std::cin);
  auto result = calc->Calculate();

  info.GetReturnValue().Set(Nan::New("Test").ToLocalChecked());
}

NAN_MODULE_INIT(InitAll)
{
  Nan::Set(target, Nan::New("calculateVoyageRecommendations").ToLocalChecked(),
           Nan::GetFunction(Nan::New<FunctionTemplate>(calculateVoyageRecommendations)).ToLocalChecked());
}

NODE_MODULE(NativeExtension, InitAll)
